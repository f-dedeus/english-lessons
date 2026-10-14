import type { LessonMaterial } from '../../types'
import VideoPlayer from '../videoPlayer'
import PdfViewer from './pdfViewer'
import AudioPlayer from './audioPlayer'

export default function MaterialView({ material }: { material: LessonMaterial }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-slate-700">{material.title}</h3>
      {material.type === 'video' && <VideoPlayer url={material.url} title={material.title} />}
      {material.type === 'pdf' && <PdfViewer url={material.url} title={material.title} />}
      {material.type === 'audio' && <AudioPlayer url={material.url} title={material.title} />}
    </div>
  )
}