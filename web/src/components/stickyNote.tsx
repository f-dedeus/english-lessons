import type { Note } from '../types'
import { noteCardStyles } from './noteColors'

const tilt = ['-rotate-1', 'rotate-1', 'rotate-0']

type Props = { note: Note; index: number; onDismiss: () => void }

export default function StickyNote({ note, index, onDismiss }: Props) {
  return (
    <div
      className={`min-w-0 rounded-md border p-4 shadow-md ${noteCardStyles[note.color]} ${tilt[index % tilt.length]}`}
    >
      <div className="mb-2 flex items-center justify-between text-xs opacity-70">
        <span>{note.pinned ? '📌 Pinned' : 'Note from your teacher'}</span>
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm wrap-anywhere">{note.text}</p>
      <button onClick={onDismiss} className="mt-3 text-xs font-medium underline opacity-80 hover:opacity-100">
        Got it, dismiss
      </button>
    </div>
  )
}