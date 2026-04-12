import crypto from 'crypto'

/**
 * WooCommerce sends X-WC-Webhook-Signature as base64(hmac_sha256(rawBody, secret)).
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks
 */
export function verifyWooCommerceWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false
  const expectedB64 = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  try {
    const a = Buffer.from(signatureHeader, 'base64')
    const b = Buffer.from(expectedB64, 'base64')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
