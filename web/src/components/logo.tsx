type Props = {
  size?: 'md' | 'lg' | 'xl'
  tone?: 'brand' | 'light'
}

const sizes = {
  md: { text: 'text-lg', icon: 'h-8 w-8' },
  lg: { text: 'text-2xl', icon: 'h-10 w-10' },
  xl: { text: 'text-5xl', icon: 'h-16 w-16' },
}

export default function Logo({ size = 'md', tone = 'brand' }: Props) {
  const light = tone === 'light'

  return (
    <span
      className={`inline-flex items-center gap-3 font-bold ${sizes[size].text} ${
        light ? 'text-cream' : 'text-indigo-600'
      }`}
    >
      <svg viewBox="0 0 64 64" className={sizes[size].icon} aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <rect x="12" y="14" width="40" height="28" rx="8" className={light ? 'fill-indigo-600' : 'fill-cream'} />
        <path d="M22 41v10l11-10z" className={light ? 'fill-indigo-600' : 'fill-cream'} />
        <text
          x="32"
          y="33"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="15"
          fontWeight="700"
          className={light ? 'fill-cream' : 'fill-indigo-600'}
        >
          EN
        </text>
        <circle cx="51" cy="13" r="7" className="fill-gem" />
      </svg>
      <span>English4all</span>
    </span>
  )
}