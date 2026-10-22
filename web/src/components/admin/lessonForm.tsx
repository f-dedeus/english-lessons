import { useState, type FormEvent } from 'react'
import type { LessonInput, LessonMaterial } from '../../types'
import { newId } from '../../utils/ids'
import { getEmbedUrl } from '../../utils/youtube'
import { getDrivePreviewUrl, isDriveUrl } from '../../utils/drive'

type MaterialDraft = { id: number; type: LessonMaterial['type']; title: string; url: string }

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function validate(title: string, status: LessonInput['status'], materials: MaterialDraft[]): string | null {
  if (!title.trim()) return 'The lesson needs a title.'
  if (status === 'published' && materials.length === 0) {
    return 'A published lesson needs at least one material.'
  }
  for (const m of materials) {
    const name = m.title.trim() || 'A material'
    if (!m.title.trim()) return 'Every material needs a title.'
    if (!isValidUrl(m.url)) return `${name} needs a valid link.`
    if (m.type === 'video' && !getEmbedUrl(m.url)) return `${name} is not a valid YouTube link.`
    if (m.type !== 'video' && isDriveUrl(m.url) && !getDrivePreviewUrl(m.url)) {
      return `${name} is not a valid Google Drive file link.`
    }
  }
  return null
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

type Props = {
  initial?: LessonInput
  submitLabel: string
  submitting: boolean
  onSubmit: (input: LessonInput) => void
}

export default function LessonForm({ initial, submitLabel, submitting, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<LessonInput['status']>(initial?.status ?? 'draft')
  const [materials, setMaterials] = useState<MaterialDraft[]>(initial?.materials ?? [])
  const [error, setError] = useState<string | null>(null)

  function addMaterial() {
    setMaterials((prev) => [...prev, { id: newId(), type: 'video', title: '', url: '' }])
  }

  function updateMaterial(id: number, patch: Partial<MaterialDraft>) {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function removeMaterial(id: number) {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validate(title, status, materials)
    setError(problem)
    if (problem) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      materials: materials.map((m) => ({ ...m, title: m.title.trim(), url: m.url.trim() })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className={inputClass}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as LessonInput['status'])}
          >
            <option value="draft">Draft (hidden from students)</option>
            <option value="published">Published (can be assigned)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Materials</h2>
          <button
            type="button"
            onClick={addMaterial}
            className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            + Add material
          </button>
        </div>

        {materials.length === 0 && (
          <p className="text-sm text-slate-500">No materials yet. Add a video, PDF or audio link.</p>
        )}

        {materials.map((m) => (
          <div key={m.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <select
                className={inputClass}
                value={m.type}
                onChange={(e) => updateMaterial(m.id, { type: e.target.value as MaterialDraft['type'] })}
              >
                <option value="video">Video (YouTube)</option>
                <option value="pdf">PDF</option>
                <option value="audio">Audio</option>
              </select>
              <input
                className={inputClass}
                placeholder="Material title"
                value={m.title}
                onChange={(e) => updateMaterial(m.id, { title: e.target.value })}
              />
            </div>
            <input
              className={inputClass}
              placeholder={
                m.type === 'video'
                  ? 'YouTube link (unlisted is fine)'
                  : 'Google Drive link (sharing: anyone with the link)'
              }
              value={m.url}
              onChange={(e) => updateMaterial(m.id, { url: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeMaterial(m.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}