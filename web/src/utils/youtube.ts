export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let id: string | null = null

    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1)
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.split('/')[2]
    } else {
      id = u.searchParams.get('v')
    }

    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}