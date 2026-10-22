import { useState } from 'react'
import { useNoteListByStudent } from '../../hooks/useNoteListByStudent'
import { useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNoteMutations'
import { noteCardStyles } from '../noteColors'
import NoteForm from './noteForm'

export default function StudentNotes({ studentId }: { studentId: number }) {
  const notes = useNoteListByStudent(studentId)
  const create = useCreateNote()
  const update = useUpdateNote()
  const remove = useDeleteNote()

  // Changing the key empties the form after a note is posted
  const [formKey, setFormKey] = useState(0)

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Sticky notes</h2>

      <NoteForm
        key={formKey}
        submitting={create.isPending}
        onSubmit={(input) =>
          create.mutate({ studentId, ...input }, { onSuccess: () => setFormKey((k) => k + 1) })
        }
      />
      {create.isError && <p className="text-sm text-red-600">Could not post the note.</p>}

      {notes.isLoading && <p className="text-slate-500">Loading notes...</p>}
      {notes.data?.length === 0 && <p className="text-slate-500">No notes for this student yet.</p>}

      <div className="space-y-3">
        {notes.data?.map((n) => (
          <div
            key={n.id}
            className={`rounded-md border p-4 ${noteCardStyles[n.color]} ${n.dismissed ? 'opacity-50' : ''}`}
          >
            <p className="whitespace-pre-wrap text-sm wrap-anywhere">{n.text}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="opacity-70">{new Date(n.createdAt).toLocaleDateString()}</span>
              {n.pinned && <span>📌 Pinned</span>}
              {n.dismissed && <span className="font-medium">Dismissed by the student</span>}
              <button
                className="font-medium underline"
                onClick={() => update.mutate({ id: n.id, patch: { pinned: !n.pinned } })}
              >
                {n.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button className="font-medium text-red-700 underline" onClick={() => remove.mutate(n.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}