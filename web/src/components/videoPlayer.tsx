import { getEmbedUrl } from '../utils/youtube'

export default function VideoPlayer({ url, title }: { url: string; title: string }) {
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return <p className="text-red-600">Invalid video link.</p>
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-sm">
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}