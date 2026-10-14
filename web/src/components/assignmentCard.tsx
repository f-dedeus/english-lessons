import { Link } from 'react-router-dom'
import type { Assignment } from '../types'
import StatusBadge from './statusBadge'
import { isOverdue } from '../utils/dates'

export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const overdue = isOverdue(assignment.dueDate, assignment.status)

  return (
    <Link
      to={`/homework/${assignment.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400"
    >
      <div>
        <p className="font-medium text-slate-800">{assignment.title}</p>
        <p className={`text-sm ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          Due: {assignment.dueDate}
          {overdue && ' · overdue'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {assignment.grade !== undefined && (
          <span className="font-bold text-slate-800">{assignment.grade}/10</span>
        )}
        <StatusBadge status={assignment.status} />
      </div>
    </Link>
  )
}