import { Link } from 'react-router-dom'
import type { Assignment } from '../types'
import StatusBadge from './statusBadge'
import { isOverdue } from '../utils/dates'

export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const overdue = isOverdue(assignment.dueDate, assignment.status)

  return (
    <Link
      to={`/homework/${assignment.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400"
    >
      <div className="min-w-0">
        <p className="font-medium text-slate-800 wrap-anywhere">{assignment.title}</p>
        <p className={`text-sm ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          Due: {assignment.dueDate}
          {overdue && ' · overdue'}
          {assignment.timeLimitMinutes !== undefined && ` · ⏱ ${assignment.timeLimitMinutes} min`}
        </p>
        {assignment.expired && (
          <p className="text-sm font-medium text-red-600">Time expired. Ask your teacher for another attempt.</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {assignment.grade !== undefined && (
          <span className="font-bold text-slate-800">{assignment.grade}/10</span>
        )}
        <StatusBadge status={assignment.status} />
      </div>
    </Link>
  )
}