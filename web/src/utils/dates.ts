import type { Assignment } from '../types'

// Local date as YYYY-MM-DD (same format as the due dates)
export const todayString = () => new Date().toLocaleDateString('en-CA')

export function isOverdue(dueDate: string, status: Assignment['status']) {
  return status === 'pending' && dueDate < todayString()
}