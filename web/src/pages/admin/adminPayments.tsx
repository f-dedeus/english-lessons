import { useEffect, useState } from 'react'
import { useStudentList } from '../../hooks/useStudentList'
import { usePaymentList } from '../../hooks/usePaymentList'
import { useSetPayment } from '../../hooks/useSetPayment'
import { todayString } from '../../utils/dates'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type NoteTarget = {
  studentId: number
  month: string // 2026-10
  title: string // "Ana · Oct 2026"
  note: string | null
}

function NoteDialog({
  target,
  onSave,
  onClose,
}: {
  target: NoteTarget
  onSave: (note: string | null) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(target.note ?? '')

  // Escape closes the dialog
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Payment note"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSave(draft.trim() || null)
        }}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Payment note</h2>
          <p className="text-sm text-slate-500">{target.title}</p>
        </div>

        <input
          autoFocus
          maxLength={200}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="For example: paid in cash"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
          {target.note && (
            <button
              type="button"
              onClick={() => onSave(null)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Remove note
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default function AdminPayments() {
  const today = todayString()
  const currentYear = Number(today.slice(0, 4))
  const currentMonthKey = today.slice(0, 7)

  const [year, setYear] = useState(currentYear)
  const [onlyUnpaid, setOnlyUnpaid] = useState(false)
  const [search, setSearch] = useState('')
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null)

  const students = useStudentList()
  const payments = usePaymentList(year)
  const setPayment = useSetPayment(year)

  const paidByKey = new Map((payments.data ?? []).map((p) => [`${p.studentId}:${p.month}`, p]))
  const monthKey = (index: number) => `${year}-${String(index + 1).padStart(2, '0')}`

  const filtering = onlyUnpaid && year === currentYear
  const query = search.trim().toLowerCase()
  const activeStudents = (students.data ?? []).filter((s) => s.status === 'active')
  const visible = activeStudents.filter(
    (s) =>
      (s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)) &&
      (!filtering || !paidByKey.has(`${s.id}:${currentMonthKey}`)),
  )

  function toggle(studentId: number, month: string, paid: boolean) {
    setPayment.mutate({ studentId, month, paid: !paid })
  }

  function saveNote(note: string | null) {
    if (!noteTarget) return
    setPayment.mutate({
      studentId: noteTarget.studentId,
      month: noteTarget.month,
      paid: true,
      note,
    })
    setNoteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            aria-label="Previous year"
          >
            ←
          </button>
          <span className="w-14 text-center text-lg font-semibold text-slate-800">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            aria-label="Next year"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          placeholder="Search students"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <label
          className={`flex items-center gap-2 text-sm ${year === currentYear ? 'text-slate-600' : 'text-slate-400'}`}
        >
          <input
            type="checkbox"
            checked={onlyUnpaid}
            disabled={year !== currentYear}
            onChange={(e) => setOnlyUnpaid(e.target.checked)}
          />
          Only students who haven't paid {MONTHS[Number(currentMonthKey.slice(5)) - 1]}
        </label>
      </div>

      {(students.isLoading || payments.isLoading) && <p className="text-slate-500">Loading...</p>}
      {(students.isError || payments.isError) && <p className="text-red-600">Could not load payments.</p>}
      {setPayment.isError && <p className="text-red-600">{setPayment.error.message}</p>}
      {students.data && visible.length === 0 && (
        <p className="text-slate-500">
          {query
            ? 'No students match your search.'
            : filtering
              ? 'Everyone has paid this month.'
              : 'No active students yet.'}
        </p>
      )}

      {visible.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-225 border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="sticky left-0 bg-white px-4 py-3 text-left font-medium">Student</th>
                {MONTHS.map((label, index) => (
                  <th
                    key={label}
                    className={`px-1 py-3 font-medium ${monthKey(index) === currentMonthKey ? 'bg-indigo-50 text-indigo-700' : ''}`}
                  >
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((student) => {
                const paidCount = MONTHS.filter((_, i) => paidByKey.has(`${student.id}:${monthKey(i)}`)).length
                return (
                  <tr key={student.id} className="border-b border-slate-100 last:border-0">
                    <td className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-800">{student.name}</td>
                    {MONTHS.map((label, index) => {
                      const month = monthKey(index)
                      const payment = paidByKey.get(`${student.id}:${month}`)
                      const paid = payment !== undefined
                      return (
                        <td
                          key={label}
                          className={`px-1 py-2 text-center ${month === currentMonthKey ? 'bg-indigo-50' : ''}`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggle(student.id, month, paid)}
                              aria-label={`${student.name}, ${label} ${year}: ${paid ? 'paid' : 'not paid'}`}
                              className={`h-7 w-7 rounded border text-sm ${
                                paid
                                  ? 'border-green-600 bg-green-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-green-600'
                              }`}
                            >
                              ✓
                            </button>
                            {paid && (
                              <button
                                title={payment.note ?? 'Add a note'}
                                onClick={() =>
                                  setNoteTarget({
                                    studentId: student.id,
                                    month,
                                    title: `${student.name} · ${label} ${year}`,
                                    note: payment.note,
                                  })
                                }
                                className={`text-xs ${payment.note ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
                              >
                                ✎
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-right text-slate-600">{paidCount}/12</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Click a square to mark that month as paid, and click again to undo. Use ✎ to add or edit a note.
      </p>

      {noteTarget && (
        <NoteDialog
          key={`${noteTarget.studentId}:${noteTarget.month}`}
          target={noteTarget}
          onSave={saveNote}
          onClose={() => setNoteTarget(null)}
        />
      )}
    </div>
  )
}