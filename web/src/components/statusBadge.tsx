import type { Assignment } from '../types'

const styles = {
  pending: 'bg-amber-100 text-amber-800',
  submitted: 'bg-blue-100 text-blue-800',
  graded: 'bg-green-100 text-green-800',
}

export default function StatusBadge({ status }: { status: Assignment['status'] }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>
  )
}