import { sql } from 'drizzle-orm'
import argon2 from 'argon2'
import { env } from '../env.ts'
import { db, pool } from './client.ts'
import {
  users,
  lessons,
  lessonMaterials,
  lessonAssignments,
  notes,
  homework,
  homeworkQuestions,
  homeworkAssignments,
  submissions,
  payments
} from './schema/index.ts'

// Dev only: everyone gets this password
const DEV_PASSWORD = 'password123'

const host = new URL(env.DATABASE_URL).hostname
if (!['localhost', '127.0.0.1'].includes(host)) {
  throw new Error(`Refusing to seed "${host}": the seed wipes all data and only runs on a local database.`)
}

async function main() {
  console.log('Clearing tables...')
  await db.execute(sql`
    truncate table payments, submissions, homework_assignments, homework_questions, homework,
      notes, lesson_assignments, lesson_materials, lessons, users
    restart identity cascade
  `)

  const passwordHash = await argon2.hash(DEV_PASSWORD)

  const [ana, bruno] = await db
    .insert(users)
    .values([
      { name: 'Ana', email: 'ana@example.com', passwordHash, role: 'student', status: 'active' },
      { name: 'Bruno', email: 'bruno@example.com', passwordHash, role: 'student', status: 'active' },
      { name: 'Carla', email: 'carla@example.com', passwordHash, role: 'student', status: 'inactive' },
      { name: 'Diego', email: 'diego@example.com', passwordHash, role: 'student', status: 'pending' },
    ])
    .returning()

  const [teacher] = await db
    .insert(users)
    .values({ name: 'Teacher', email: 'teacher@example.com', passwordHash, role: 'teacher', status: 'active' })
    .returning()

  const months = (year: number, from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => `${year}-${String(from + i).padStart(2, '0')}-01`)

  await db.insert(payments).values([
    ...months(2026, 1, 10).map((month) => ({ studentId: ana.id, month })),
    ...months(2026, 1, 8).map((month) => ({ studentId: bruno.id, month })),
    { studentId: bruno.id, month: '2026-09-01', note: 'Paid in cash' },
  ])
    
  const [presentSimple, pastSimple] = await db
    .insert(lessons)
    .values([
      { title: 'Present Simple', description: 'Habits and routines.', status: 'published', createdBy: teacher.id },
      { title: 'Past Simple', description: 'Talking about finished actions.', status: 'published', createdBy: teacher.id },
      { title: 'Future Tenses', description: 'Work in progress.', status: 'draft', createdBy: teacher.id },
    ])
    .returning()

  await db.insert(lessonMaterials).values([
    { lessonId: presentSimple.id, type: 'video', title: 'Explanation', url: 'https://www.youtube.com/watch?v=xxxx', position: 0 },
    { lessonId: presentSimple.id, type: 'pdf', title: 'Worksheet', url: 'https://drive.google.com/file/d/PDF_FILE_ID/view', position: 1 },
    { lessonId: pastSimple.id, type: 'video', title: 'Explanation', url: 'https://youtu.be/yyyy', position: 0 },
    { lessonId: pastSimple.id, type: 'audio', title: 'Listening exercise', url: 'https://drive.google.com/file/d/AUDIO_FILE_ID/view', position: 1 },
  ])

  await db.insert(lessonAssignments).values([
    { lessonId: presentSimple.id, studentId: ana.id },
    { lessonId: pastSimple.id, studentId: ana.id },
    { lessonId: presentSimple.id, studentId: bruno.id },
  ])

  await db.insert(notes).values({
    studentId: ana.id,
    createdBy: teacher.id,
    text: 'Remember to bring your notebook on Thursday!',
    color: 'yellow',
    pinned: true,
  })

  const [hw1, hw2] = await db
    .insert(homework)
    .values([
      {
        lessonId: presentSimple.id,
        title: 'Write 5 sentences about your day',
        instructions: 'Take your time and use the Present Simple.',
      },
      { lessonId: pastSimple.id, title: 'Past Simple exercises', instructions: '' },
    ])
    .returning()

  await db.insert(homeworkQuestions).values({
    homeworkId: hw1.id,
    position: 0,
    content: { type: 'open_text', prompt: 'Write at least five sentences about your daily routine.' },
  })

  const hw2Questions = await db
    .insert(homeworkQuestions)
    .values([
      {
        homeworkId: hw2.id,
        position: 0,
        content: {
          type: 'multiple_choice',
          prompt: 'Which sentence is correct?',
          options: ['I goed to school.', 'I went to school.', 'I go to school yesterday.'],
          correct: [1],
          multiple: false,
        },
      },
      {
        homeworkId: hw2.id,
        position: 1,
        content: {
          type: 'fill_blanks',
          text: 'Yesterday I ___ (watch) a movie and ___ (eat) pizza.',
          answers: ['watched', 'ate'],
        },
      },
      {
        homeworkId: hw2.id,
        position: 2,
        content: {
          type: 'multiple_choice',
          prompt: 'Which of these verbs are irregular?',
          options: ['walk', 'go', 'eat', 'play'],
          correct: [1, 2],
          multiple: true,
        },
      },
      {
        homeworkId: hw2.id,
        position: 3,
        content: { type: 'open_text', prompt: 'Write two sentences about what you did last weekend.' },
      },
    ])
    .returning()

  const [, anaPastSimple] = await db
    .insert(homeworkAssignments)
    .values([
      { homeworkId: hw1.id, studentId: ana.id, dueDate: '2026-10-20', status: 'pending' },
      { homeworkId: hw2.id, studentId: ana.id, dueDate: '2026-10-03', status: 'graded' },
    ])
    .returning()

  const [q1, q2, q3, q4] = hw2Questions
  await db.insert(submissions).values({
    homeworkAssignmentId: anaPastSimple.id,
    answers: {
      [q1.id]: { type: 'multiple_choice', selected: [1] },
      [q2.id]: { type: 'fill_blanks', values: ['watched', 'ate'] },
      [q3.id]: { type: 'multiple_choice', selected: [1, 2] },
      [q4.id]: { type: 'open_text', text: 'I played football and watched TV.' },
    },
    grade: 9,
    feedback: 'Great work! Next time use more connecting words.',
    gradedAt: new Date(),
  })

  console.log('Done. Demo logins (password for all: %s):', DEV_PASSWORD)
  console.log('  teacher@example.com (teacher), ana@example.com, bruno@example.com')
  console.log('  carla@example.com exists but is inactive')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())    