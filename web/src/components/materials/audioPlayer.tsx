import { getDrivePreviewUrl, isDriveUrl } from '../../utils/drive'

export default function AudioPlayer({ url, title }: { url: string; title: string }) {
  // Drive files can't be played by a plain <audio> tag, so they use Drive's own player
  if (isDriveUrl(url)) {
    const src = getDrivePreviewUrl(url)
    if (!src) return <p className="text-red-600">Invalid audio link.</p>
    return (
      <iframe
        src={src}
        title={title}
        className="h-48 w-full rounded-lg border border-slate-200 bg-white"
      />
    )
  }

  return <audio controls src={url} className="w-full" />
}