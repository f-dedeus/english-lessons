export function isDriveUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('drive.google.com')
  } catch {
    return false
  }
}

export function getDrivePreviewUrl(url: string): string | null {
  const match = url.match(/\/file\/d\/([^/?]+)/) ?? url.match(/[?&]id=([^&]+)/)
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null
}