import type { WooProduct } from './types'

export function parseWooPrice(p: WooProduct): number {
  const raw = p.on_sale && p.sale_price ? p.sale_price : p.regular_price
  if (raw === undefined || raw === null || raw === '') return 0
  const n = parseFloat(String(raw).replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

export function buildWooSku(resourceId: number, sku: string | undefined | null, isVariation: boolean): string {
  const trimmed = (sku || '').trim()
  if (trimmed.length > 0) {
    return trimmed.slice(0, 180)
  }
  return isVariation ? `woo-var-${resourceId}` : `woo-${resourceId}`
}

export function parseWooStock(p: WooProduct, previousStock?: number): number {
  if (p.manage_stock === true && p.stock_quantity != null && p.stock_quantity !== '') {
    const q =
      typeof p.stock_quantity === 'number'
        ? p.stock_quantity
        : parseInt(String(p.stock_quantity), 10)
    if (Number.isFinite(q)) return Math.max(0, Math.min(q, 1_000_000_000))
  }
  if (p.stock_status === 'instock') return previousStock !== undefined ? previousStock : 0
  if (p.stock_status === 'onbackorder') return previousStock !== undefined ? previousStock : 0
  if (p.stock_status === 'outofstock') return 0
  return previousStock !== undefined ? previousStock : 0
}

export function parseWooModifiedDate(iso?: string): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function extractResourceId(payload: unknown): number | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload
  if (typeof payload === 'object' && payload !== null && 'id' in payload) {
    const id = (payload as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10)
  }
  return null
}
