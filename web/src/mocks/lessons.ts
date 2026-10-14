import type { Lesson } from '../types'

export const mockLessons: Lesson[] = [
  {
    id: 1,
    title: 'Present Simple',
    description: 'Habits and routines.',
    status: 'published',
    materials: [
      { id: 1, type: 'video', title: 'Explanation', url: 'https://www.youtube.com/watch?v=xxxx' },
      { id: 2, type: 'pdf', title: 'Worksheet', url: 'https://drive.google.com/file/d/18pqhRUYePUfB-LTEQhxVp9dMVvUWoU-c/view?usp=drive_link' },
    ],
  },
  {
    id: 2,
    title: 'Past Simple',
    description: 'Talking about finished actions.',
    status: 'published',
    materials: [
      { id: 3, type: 'video', title: 'Explanation', url: 'https://youtu.be/yyyy' },
      { id: 4, type: 'audio', title: 'Listening exercise', url: 'https://drive.google.com/file/d/1J6wStZWx-6RWQnMbQa5nvsLk6AKwewxu/view?usp=drive_link' },
    ],
  },
  {
    id: 3,
    title: 'Future Tenses',
    description: 'Work in progress.',
    status: 'draft',
    materials: [],
  },
]