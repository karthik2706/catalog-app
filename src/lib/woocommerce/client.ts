import type { WooCredentials } from './types'

export function normalizeSiteUrl(siteUrl: string): string {
  const trimmed = siteUrl.trim().replace(/\/+$/, '')
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return `${u.protocol}//${u.host}`
  } catch {
    throw new Error('Invalid WooCommerce site URL')
  }
}

export async function wooRestFetch<T>(
  creds: WooCredentials,
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = normalizeSiteUrl(creds.siteUrl)
  const rel = path.startsWith('/') ? path : `/${path}`
  const url = `${base}/wp-json/wc/v3${rel}`
  const token = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64')
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`WooCommerce REST ${res.status}: ${text.slice(0, 800)}`)
  }
  if (res.status === 204 || !text) {
    return {} as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('WooCommerce REST returned non-JSON body')
  }
}

/** Minimal read to verify keys and URL (requires read access on products). */
export async function wooRestPing(creds: WooCredentials): Promise<{ ok: true }> {
  await wooRestFetch<unknown[]>(creds, '/products?per_page=1')
  return { ok: true }
}
