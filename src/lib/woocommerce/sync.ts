import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { wooRestFetch } from './client'
import type { WooCredentials, WooProduct } from './types'
import { decryptSecret } from '@/lib/woo-crypto'
import {
  parseWooPrice,
  buildWooSku,
  parseWooStock,
  parseWooModifiedDate,
  extractResourceId,
} from './woo-mappers'

export {
  parseWooPrice,
  buildWooSku,
  parseWooStock,
  parseWooModifiedDate,
  extractResourceId,
} from './woo-mappers'

async function ensureUniqueSku(
  clientId: string,
  desiredSku: string,
  excludeProductId?: string
): Promise<string> {
  let candidate = desiredSku.slice(0, 180)
  let n = 0
  for (;;) {
    const existing = await prisma.product.findFirst({
      where: {
        clientId,
        sku: candidate,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
    })
    if (!existing) return candidate
    n += 1
    candidate = `${desiredSku.slice(0, 150)}-w${n}`.slice(0, 180)
  }
}

function sortTermsByHierarchy<T extends { id: number; parent?: number }>(terms: T[]): T[] {
  const byId = new Map(terms.map((t) => [t.id, t]))
  const ordered: T[] = []
  const seen = new Set<number>()
  function visit(tid: number) {
    if (seen.has(tid)) return
    const t = byId.get(tid)
    if (!t) return
    const p = t.parent ?? 0
    if (p > 0 && byId.has(p)) visit(p)
    if (!seen.has(tid)) {
      ordered.push(t)
      seen.add(tid)
    }
  }
  for (const t of terms) visit(t.id)
  return ordered
}

async function resolveWooCategoryToId(
  connectionId: string,
  clientId: string,
  creds: WooCredentials,
  term: { id: number; name: string; parent?: number }
): Promise<string> {
  const existing = await prisma.wooCategoryMap.findUnique({
    where: { connectionId_wooTermId: { connectionId, wooTermId: term.id } },
  })
  if (existing) return existing.categoryId

  const parentWoo = term.parent ?? 0
  let parentCategoryId: string | null = null
  if (parentWoo > 0) {
    const parentMap = await prisma.wooCategoryMap.findUnique({
      where: { connectionId_wooTermId: { connectionId, wooTermId: parentWoo } },
    })
    if (parentMap) {
      parentCategoryId = parentMap.categoryId
    } else {
      try {
        const parentTerm = await wooRestFetch<{ id: number; name: string; parent?: number }>(
          creds,
          `/products/categories/${parentWoo}`
        )
        parentCategoryId = await resolveWooCategoryToId(connectionId, clientId, creds, parentTerm)
      } catch {
        parentCategoryId = null
      }
    }
  }

  const cat = await prisma.category.create({
    data: {
      name: term.name.slice(0, 255),
      clientId,
      parentId: parentCategoryId,
      isActive: true,
    },
  })
  await prisma.wooCategoryMap.create({
    data: {
      connectionId,
      wooTermId: term.id,
      categoryId: cat.id,
    },
  })
  return cat.id
}

async function getOrCreateDefaultCategory(clientId: string): Promise<string> {
  const name = 'Uncategorized'
  const found = await prisma.category.findFirst({
    where: { clientId, parentId: null, name: { equals: name, mode: 'insensitive' } },
  })
  if (found) return found.id
  const c = await prisma.category.create({
    data: { name, clientId, isActive: true, parentId: null },
  })
  return c.id
}

async function resolveCategoryIdsForProduct(
  connectionId: string,
  clientId: string,
  creds: WooCredentials,
  woo: WooProduct
): Promise<string[]> {
  const terms = woo.categories || []
  if (terms.length === 0) {
    return [await getOrCreateDefaultCategory(clientId)]
  }
  const sorted = sortTermsByHierarchy(terms)
  const ids: string[] = []
  for (const t of sorted) {
    const id = await resolveWooCategoryToId(connectionId, clientId, creds, t)
    if (!ids.includes(id)) ids.push(id)
  }
  return ids.length ? ids : [await getOrCreateDefaultCategory(clientId)]
}

function buildImagesJson(woo: WooProduct): Prisma.InputJsonValue {
  const imgs = woo.images || []
  const arr = imgs
    .filter((i) => i.src)
    .map((img, idx) => ({
      id: `woo-ext-${woo.id}-${idx}`,
      url: img.src as string,
      fileName: (img.name || img.alt || `image-${idx + 1}`).slice(0, 200),
      fileType: 'image/jpeg',
      fileSize: 0,
      uploadedAt: new Date().toISOString(),
    }))
  return arr as unknown as Prisma.InputJsonValue
}

function mergeDescription(woo: WooProduct): string {
  const short = (woo.short_description || '').trim()
  const long = (woo.description || '').trim()
  if (long && short && long !== short) return `${short}\n\n${long}`
  return long || short || ''
}

export type WooConnectionRow = {
  id: string
  clientId: string
  siteUrl: string
  consumerKeyEnc: string
  consumerSecretEnc: string
}

export function getCredentialsFromConnection(row: WooConnectionRow): WooCredentials {
  return {
    siteUrl: row.siteUrl,
    consumerKey: decryptSecret(row.consumerKeyEnc),
    consumerSecret: decryptSecret(row.consumerSecretEnc),
  }
}

async function upsertMappedProduct(
  connectionId: string,
  clientId: string,
  woo: WooProduct,
  creds: WooCredentials,
  opts: { isVariation: boolean; parentWooId: number | null }
): Promise<{ productId: string; created: boolean }> {
  const wooResourceId = woo.id
  const wooParentResourceId = opts.isVariation ? opts.parentWooId : null
  const isVariation = opts.isVariation

  const rawSku = buildWooSku(wooResourceId, woo.sku, isVariation)
  const price = parseWooPrice(woo)
  const categoryIds = await resolveCategoryIdsForProduct(connectionId, clientId, creds, woo)
  const primaryCategoryId = categoryIds[0]
  const primaryCat = await prisma.category.findUnique({ where: { id: primaryCategoryId } })
  const categoryName = primaryCat?.name || 'Uncategorized'

  const existingMap = await prisma.wooProductMap.findUnique({
    where: { connectionId_wooResourceId: { connectionId, wooResourceId } },
    include: { product: true },
  })

  const modGmt = parseWooModifiedDate(woo.date_modified_gmt)
  if (
    existingMap?.lastWooModifiedGmt &&
    modGmt &&
    existingMap.lastWooModifiedGmt.getTime() > modGmt.getTime()
  ) {
    return { productId: existingMap.productId, created: false }
  }

  const visible = woo.status === 'publish' || woo.status === 'private'
  const isActive =
    visible &&
    woo.status !== 'trash' &&
    woo.status !== 'pending' &&
    (isVariation || woo.type !== 'variable')

  const images = buildImagesJson(woo)
  const thumb =
    woo.images && woo.images[0]?.src
      ? woo.images[0].src
      : null

  const sku = await ensureUniqueSku(clientId, rawSku, existingMap?.productId)
  const desc = mergeDescription(woo)
  const stockLevel = parseWooStock(woo, existingMap?.product?.stockLevel)

  const dataCore = {
    name: woo.name.slice(0, 500) || `Product ${wooResourceId}`,
    sku,
    description: desc.slice(0, 50000),
    price,
    category: categoryName,
    categoryId: primaryCategoryId,
    stockLevel,
    isActive: isVariation ? isActive && woo.status !== 'trash' : isActive && woo.type !== 'variable',
    images,
    thumbnailUrl: thumb,
    variations: [] as Prisma.InputJsonValue,
  }

  if (existingMap) {
    await prisma.productCategory.deleteMany({ where: { productId: existingMap.productId } })
    await prisma.product.update({
      where: { id: existingMap.productId },
      data: {
        ...dataCore,
        clientId,
      },
    })
    for (const cid of categoryIds) {
      await prisma.productCategory.create({
        data: { productId: existingMap.productId, categoryId: cid },
      })
    }
    await prisma.wooProductMap.update({
      where: { id: existingMap.id },
      data: { lastWooModifiedGmt: modGmt, wooParentResourceId },
    })
    return { productId: existingMap.productId, created: false }
  }

  const product = await prisma.product.create({
    data: {
      ...dataCore,
      clientId,
      minStock: 0,
      categories: {
        create: categoryIds.map((cid) => ({ categoryId: cid })),
      },
    },
  })
  await prisma.wooProductMap.create({
    data: {
      connectionId,
      wooResourceId,
      wooParentResourceId,
      productId: product.id,
      lastWooModifiedGmt: modGmt,
    },
  })
  return { productId: product.id, created: true }
}

export async function syncVariableParent(
  connection: WooConnectionRow,
  creds: WooCredentials,
  parent: WooProduct
): Promise<void> {
  const parentId = parent.id
  const variations: WooProduct[] = []
  let page = 1
  for (;;) {
    const batch = await wooRestFetch<WooProduct[]>(
      creds,
      `/products/${parentId}/variations?per_page=100&page=${page}`
    )
    if (!Array.isArray(batch) || batch.length === 0) break
    variations.push(...batch)
    if (batch.length < 100) break
    page += 1
    if (page > 500) break
  }

  const currentIds = new Set(variations.map((v) => v.id))
  for (const v of variations) {
    await upsertMappedProduct(connection.id, connection.clientId, v, creds, {
      isVariation: true,
      parentWooId: parentId,
    })
  }

  const maps = await prisma.wooProductMap.findMany({
    where: { connectionId: connection.id, wooParentResourceId: parentId },
  })
  for (const m of maps) {
    if (!currentIds.has(m.wooResourceId)) {
      await prisma.product.update({
        where: { id: m.productId },
        data: { isActive: false },
      })
      await prisma.wooProductMap.delete({ where: { id: m.id } })
    }
  }
}

export async function upsertFromWooProduct(
  connection: WooConnectionRow,
  creds: WooCredentials,
  woo: WooProduct
): Promise<{ productId?: string; created?: boolean; skipped?: boolean }> {
  if (woo.type === 'variable') {
    await syncVariableParent(connection, creds, woo)
    return { skipped: true }
  }
  if (woo.type === 'variation') {
    const parentId = woo.parent_id
    if (!parentId) {
      throw new Error('WooCommerce variation missing parent_id')
    }
    return upsertMappedProduct(connection.id, connection.clientId, woo, creds, {
      isVariation: true,
      parentWooId: parentId,
    })
  }
  if (woo.type === 'simple' || woo.type === 'external' || woo.type === 'grouped') {
    return upsertMappedProduct(connection.id, connection.clientId, woo, creds, {
      isVariation: false,
      parentWooId: null,
    })
  }
  return { skipped: true }
}

export async function deactivateByWooResource(connectionId: string, wooResourceId: number): Promise<void> {
  const maps = await prisma.wooProductMap.findMany({
    where: {
      connectionId,
      OR: [{ wooResourceId }, { wooParentResourceId: wooResourceId }],
    },
  })
  for (const m of maps) {
    await prisma.product.update({
      where: { id: m.productId },
      data: { isActive: false },
    })
    await prisma.wooProductMap.delete({ where: { id: m.id } })
  }
}

export async function fetchWooProduct(
  creds: WooCredentials,
  id: number,
  topic: string,
  body: Record<string, unknown>
): Promise<WooProduct> {
  if (topic.includes('variation')) {
    const parentId = body.parent_id as number | undefined
    if (!parentId) {
      throw new Error('Variation webhook missing parent_id')
    }
    return wooRestFetch<WooProduct>(creds, `/products/${parentId}/variations/${id}`)
  }
  return wooRestFetch<WooProduct>(creds, `/products/${id}`)
}

export async function processWebhookPayload(params: {
  connection: WooConnectionRow
  topic: string
  payload: unknown
  resourceIdFallback?: number | null
}): Promise<{ handled: boolean }> {
  const { connection, topic, payload, resourceIdFallback } = params
  const creds = getCredentialsFromConnection(connection)
  const lower = topic.toLowerCase()

  if (lower.endsWith('.deleted')) {
    const id = extractResourceId(payload) ?? resourceIdFallback
    if (id == null) throw new Error('Delete webhook without resource id')
    await deactivateByWooResource(connection.id, id)
    return { handled: true }
  }

  if (
    lower.includes('product') &&
    (lower.endsWith('.updated') ||
      lower.endsWith('.created') ||
      lower.endsWith('.restored') ||
      lower.endsWith('.trashed'))
  ) {
    const id = extractResourceId(payload) ?? resourceIdFallback
    if (id == null) throw new Error('Product webhook without resource id')
    const body =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : { id }
    const full = await fetchWooProduct(creds, id, topic, body)
    await upsertFromWooProduct(connection, creds, full)
    return { handled: true }
  }

  return { handled: false }
}

export async function backfillProductsPage(
  connection: WooConnectionRow,
  creds: WooCredentials,
  page: number,
  perPage: number
): Promise<{ processed: number; hasMore: boolean }> {
  const list = await wooRestFetch<WooProduct[]>(
    creds,
    `/products?per_page=${perPage}&page=${page}&status=publish,draft&orderby=modified&order=desc`
  )
  if (!Array.isArray(list)) {
    throw new Error('Unexpected WooCommerce products list response')
  }
  let n = 0
  for (const p of list) {
    await upsertFromWooProduct(connection, creds, p)
    n += 1
  }
  return { processed: n, hasMore: list.length >= perPage }
}
