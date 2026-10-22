import { asc, inArray, type SQL } from 'drizzle-orm'
import { db } from './client.ts'
import { lessonMaterials, lessons } from './schema/index.ts'

export async function fetchLessons(where?: SQL) {
  const rows = await db.select().from(lessons).where(where).orderBy(asc(lessons.id))
  if (rows.length === 0) return []

  const materials = await db
    .select()
    .from(lessonMaterials)
    .where(
      inArray(
        lessonMaterials.lessonId,
        rows.map((l) => l.id),
      ),
    )
    .orderBy(asc(lessonMaterials.position), asc(lessonMaterials.id))

  return rows.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    status: lesson.status,
    materials: materials
      .filter((m) => m.lessonId === lesson.id)
      .map((m) => ({ id: m.id, type: m.type, title: m.title, url: m.url })),
  }))
}