import type { CriterionKey, FinalLevel, InterviewScores, Mark } from '../types'

export const MARKS: Mark[] = ['Pre-A1', 'A1', 'A2', 'B1']
export const FINAL_LEVELS: FinalLevel[] = ['Pre-A1', 'A1', 'A2', 'B1', 'Above B1']

// Copied from the teacher's interview rubric (in Portuguese, on purpose)
export const CRITERIA: {
  key: CriterionKey
  label: string
  descriptors: Record<'A1' | 'A2' | 'B1', string>
}[] = [
  {
    key: 'comprehension',
    label: 'Compreensão',
    descriptors: {
      A1: 'Entende perguntas simples ditas devagar, às vezes com repetição',
      A2: 'Entende perguntas do dia a dia em ritmo normal',
      B1: 'Entende perguntas abertas e pedidos de opinião',
    },
  },
  {
    key: 'fluency',
    label: 'Fluência',
    descriptors: {
      A1: 'Palavras soltas e frases curtas, pausas longas',
      A2: 'Frases simples ligadas por and, but, because',
      B1: 'Fala por 1 a 2 minutos com algumas pausas',
    },
  },
  {
    key: 'grammar',
    label: 'Gramática',
    descriptors: {
      A1: 'Usa o presente com erros frequentes',
      A2: 'Usa passado e futuro simples, com alguns erros',
      B1: 'Usa present perfect, condicionais e conectores com poucos erros',
    },
  },
  {
    key: 'vocabulary',
    label: 'Vocabulário',
    descriptors: {
      A1: 'Família, comida, rotina, números',
      A2: 'Viagens, lugares, compras, descrições',
      B1: 'Opiniões, sentimentos, experiências, temas gerais',
    },
  },
  {
    key: 'pronunciation',
    label: 'Pronúncia',
    descriptors: {
      A1: 'Precisa de esforço do ouvinte para ser entendido',
      A2: 'Entendível na maior parte do tempo',
      B1: 'Clara, mesmo com sotaque marcado',
    },
  },
]

// "O nível oral é a coluna em que o aluno se encaixa em pelo menos 3 dos 5 critérios."
// The server does the same calculation when saving; this one is for the live preview.
export function computeOralLevel(scores: InterviewScores): {
  level: Mark
  marksAtLevel: number
  clear: boolean
} {
  const marks = Object.values(scores)

  for (const level of MARKS) {
    const marksAtLevel = marks.filter((m) => m === level).length
    if (marksAtLevel >= 3) return { level, marksAtLevel, clear: true }
  }

  // No column has 3 criteria: propose the middle mark and ask the teacher to review it
  const sorted = marks.map((m) => MARKS.indexOf(m)).sort((a, b) => a - b)
  const level = MARKS[sorted[2]]
  return { level, marksAtLevel: marks.filter((m) => m === level).length, clear: false }
}

// Position on the scale, to compare the written and the oral level
function position(level: string): number {
  switch (level) {
    case 'Pre-A1':
      return 0
    case 'A1 initial': // below a full A1, but the same step as A1 for this comparison
    case 'A1':
      return 1
    case 'A2':
      return 2
    case 'B1':
      return 3
    default:
      return 4 // Above B1
  }
}

// The document's "Resultado final" table
export function suggestFinalLevel(
  written: string | undefined,
  oral: Mark,
  possiblyAboveB1 = false,
): { level: FinalLevel; hint: string; extra?: string } {
  const extra =
    possiblyAboveB1 && oral === 'B1'
      ? 'Passou o Bloco 3 com 9 ou 10 acertos: se for muito bem na entrevista, pode estar acima de B1. Vale uma conversa mais longa antes de fechar o nível.'
      : undefined

  if (!written) return { level: oral, hint: '', extra }

  const w = position(written)
  const o = position(oral)
  const diff = w - o

  if (diff === 0) return { level: oral, hint: 'Seguir o material do nível', extra }
  if (diff === 1) {
    return { level: oral, hint: 'Aluno que "sabe a regra mas não fala": focar em produção oral', extra }
  }
  if (diff === -1) {
    return { level: oral, hint: 'Aluno comunicativo com base fraca: revisar gramática rápido', extra }
  }

  // Two levels apart (or more): the level in between
  const between = FINAL_LEVELS[Math.floor((w + o) / 2)]
  return { level: between, hint: 'Reavaliar após as primeiras 4 aulas', extra }
}