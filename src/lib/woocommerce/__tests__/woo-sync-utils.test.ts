import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { parseWooPrice, buildWooSku, parseWooStock, extractResourceId } from '../woo-mappers'
import { verifyWooCommerceWebhookSignature } from '../webhook-signature'
import type { WooProduct } from '../types'

describe('parseWooPrice', () => {
  it('uses sale price when on_sale', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      regular_price: '100',
      sale_price: '80',
      on_sale: true,
    } as WooProduct
    expect(parseWooPrice(p)).toBe(80)
  })

  it('returns 0 for empty prices', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      regular_price: '',
    } as WooProduct
    expect(parseWooPrice(p)).toBe(0)
  })

  it('clamps negative parsed values', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      regular_price: '-5',
    } as WooProduct
    expect(parseWooPrice(p)).toBe(0)
  })
})

describe('buildWooSku', () => {
  it('prefers non-empty sku', () => {
    expect(buildWooSku(12, 'ABC-1', false)).toBe('ABC-1')
  })

  it('falls back to synthetic ids', () => {
    expect(buildWooSku(12, '', false)).toBe('woo-12')
    expect(buildWooSku(12, '  ', true)).toBe('woo-var-12')
  })
})

describe('parseWooStock', () => {
  it('respects manage_stock quantity', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 7,
    } as WooProduct
    expect(parseWooStock(p)).toBe(7)
  })

  it('uses previous stock for instock without manage_stock', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      manage_stock: false,
      stock_status: 'instock',
    } as WooProduct
    expect(parseWooStock(p, 4)).toBe(4)
  })

  it('clamps huge quantities', () => {
    const p = {
      id: 1,
      name: 'x',
      type: 'simple',
      sku: 's',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 2_000_000_000,
    } as WooProduct
    expect(parseWooStock(p)).toBe(1_000_000_000)
  })
})

describe('extractResourceId', () => {
  it('parses nested id', () => {
    expect(extractResourceId({ id: 99 })).toBe(99)
    expect(extractResourceId({ id: '101' })).toBe(101)
  })

  it('returns null for invalid', () => {
    expect(extractResourceId({})).toBe(null)
    expect(extractResourceId(null)).toBe(null)
  })
})

describe('verifyWooCommerceWebhookSignature', () => {
  it('accepts valid Woo-style signature', () => {
    const secret = 'test-secret'
    const raw = '{"id":1}'
    const sig = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('base64')
    expect(verifyWooCommerceWebhookSignature(raw, sig, secret)).toBe(true)
  })

  it('rejects wrong secret', () => {
    const raw = '{}'
    const sig = crypto.createHmac('sha256', 'a').update(raw, 'utf8').digest('base64')
    expect(verifyWooCommerceWebhookSignature(raw, sig, 'b')).toBe(false)
  })
})
