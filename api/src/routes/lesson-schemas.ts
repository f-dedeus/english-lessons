import { z } from 'zod'

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }, 'The link must start with http:// or https://')

const materialType = z.enum(['video', 'pdf', 'audio'])

// What the teacher sends (ids are ignored: the database assigns them)
export const materialInput = z.object({
  type: materialType,
  title: z.string().trim().min(1).max(200),
  url: httpUrl,
})

// What the API returns
export const lessonSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published']),
  materials: z.array(
    z.object({ id: z.number(), type: materialType, title: z.string(), url: z.string() }),
  ),
})