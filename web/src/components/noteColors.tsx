import type { NoteColor } from '../types'

export const noteCardStyles: Record<NoteColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  pink: 'bg-pink-100 border-pink-300 text-pink-900',
  blue: 'bg-sky-100 border-sky-300 text-sky-900',
  green: 'bg-green-100 border-green-300 text-green-900',
}

export const noteSwatchStyles: Record<NoteColor, string> = {
  yellow: 'bg-yellow-300',
  pink: 'bg-pink-300',
  blue: 'bg-sky-300',
  green: 'bg-green-300',
}

export const noteColors = Object.keys(noteCardStyles) as NoteColor[]