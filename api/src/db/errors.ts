// Postgres error 23505 = unique constraint violated (for example, a repeated email)
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

// Postgres error 23503 = foreign key violated (for example, deleting a lesson that is still in use)
export function isForeignKeyViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23503' || e?.cause?.code === '23503'
}