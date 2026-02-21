/**
 * Returns true if the URL points to a video file (by path extension).
 * Use this to decide whether to render <video> or <img> for thumbnails.
 */
export function isVideoUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const path = url.split('?')[0] || ''
  return /\.(mp4|webm|mov|ogg|m4v)$/i.test(path)
}
