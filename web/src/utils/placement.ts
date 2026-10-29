export function describeLevel(level: string | undefined, possiblyAboveB1 = false) {
  if (!level) return null

  if (level === 'B1' && possiblyAboveB1) {
    return {
      label: 'B1 or higher',
      description:
        'You did very well! Your teacher will check in the conversation test if you are above B1.',
    }
  }

  switch (level) {
    case 'Pre-A1':
      return {
        label: 'Beginner (Pre-A1)',
        description: 'You are at the very start of your English journey, which is a great place to begin.',
      }
    case 'A1 initial':
      return {
        label: 'A1 (just starting)',
        description: 'You know some basics and you are ready to build on them.',
      }
    case 'A1':
      return { label: 'A1 (beginner)', description: 'You can understand and use simple, everyday English.' }
    case 'A2':
      return {
        label: 'A2 (elementary)',
        description: 'You can talk about everyday topics, the past and your plans.',
      }
    case 'B1':
      return {
        label: 'B1 (intermediate)',
        description: 'You can handle most everyday situations and talk about experiences and opinions.',
      }
    default:
      return { label: level, description: '' }
  }
}