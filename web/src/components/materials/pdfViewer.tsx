import { getDrivePreviewUrl, isDriveUrl } from '../../utils/drive'

export default function PdfViewer({ url, title }: { url: string; title: string }) {
  const src = isDriveUrl(url) ? getDrivePreviewUrl(url) : url

  if (!src) return <p className="text-red-600">Invalid PDF link.</p>

  return (
    <div className="space-y-2">
      <iframe
        src={src}
        title={title}
        className="h-150 w-full rounded-lg border border-slate-200 bg-white"
      />
      <a href={url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
        Open in a new tab
      </a>
    </div>
  )
}