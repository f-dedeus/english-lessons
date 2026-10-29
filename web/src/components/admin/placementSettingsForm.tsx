import { useState, type FormEvent } from 'react'
import { usePlacementSettings, useSaveSettings } from '../../hooks/usePlacementAdmin'
import type { PlacementSettings } from '../../types'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

function SettingsBody({ initial }: { initial: PlacementSettings }) {
  const save = useSaveSettings()
  const [minutes, setMinutes] = useState(String(initial.timeLimitMinutes))
  const [message, setMessage] = useState(initial.schedulingMessage)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)

    const limit = Number(minutes)
    if (!Number.isInteger(limit) || limit < 0 || limit > 600) {
      return setError('The time limit must be a whole number of minutes, from 0 to 600.')
    }
    if (!message.trim()) return setError('Write the message students see after the test.')

    setError(null)
    save.mutate(
      { timeLimitMinutes: limit, schedulingMessage: message.trim() },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-800">Test settings</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Time limit (minutes)</label>
        <input
          type="number"
          min={0}
          max={600}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          0 means no time limit. It applies to attempts started from now on.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Message shown after the test (how to schedule the conversation test)
        </label>
        <textarea
          rows={4}
          maxLength={2000}
          className={inputClass}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          You can include a link or a contact (for example a WhatsApp number or a booking page).
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {save.isError && <p className="text-sm text-red-600">{save.error.message}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <button
        type="submit"
        disabled={save.isPending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {save.isPending ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  )
}

export default function PlacementSettingsForm() {
  const settings = usePlacementSettings()

  if (settings.isLoading) return <p className="text-slate-500">Loading settings...</p>
  if (settings.isError || !settings.data) return <p className="text-red-600">Could not load the settings.</p>

  return <SettingsBody initial={settings.data} />
}