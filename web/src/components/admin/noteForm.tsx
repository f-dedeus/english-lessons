import { useState, type FormEvent } from 'react'
import type { NoteColor, NoteInput } from '../../types'
import { noteColors, noteSwatchStyles } from '../noteColors'

const MAX_LENGTH = 280

type Props = {
  submitting: boolean
  onSubmit: (input: Omit<NoteInput, 'studentId'>) => void
}

export default function NoteForm({ submitting, onSubmit }: Props) {
  const [text, setText] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return setError('Write something first.')
    setError(null)
    onSubmit({ text: text.trim(), color, pinned })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <textarea
        rows={3}
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a note for this student..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {noteColors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ${noteSwatchStyles[c]} ${
                color === c ? 'ring-2 ring-slate-700 ring-offset-2' : ''
              }`}
            />
          ))}
          <label className="ml-4 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to the top
          </label>
        </div>
        <span className="text-xs text-slate-400">{text.length}/{MAX_LENGTH}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Posting...' : 'Post note'}
      </button>
    </form>
  )
}