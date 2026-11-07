import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from './logo'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  // The box on the right side (and a simple link under the form on small screens)
  cta?: { text: string; label: string; to: string }
}

export default function AuthLayout({ title, subtitle, children, cta }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#1a0f0a] text-[#fff6e8] lg:flex-row">
      {/* Form side */}
      <section className="flex w-full flex-col px-6 py-10 sm:px-12 lg:w-[28%] lg:min-w-110 lg:px-14 lg:py-24">
        <div className="mx-auto w-full max-w-sm lg:mx-0">
          <div className="mb-10 lg:hidden">
            <Logo tone="light" />
          </div>

          <h1 className="text-4xl font-normal tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-base tracking-wide text-[#c2ae9a]">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {cta && (
            <p className="mt-10 text-center text-sm text-[#c2ae9a] lg:hidden">
              {cta.text}{' '}
              <Link to={cta.to} className="font-medium text-[#ffc83d] underline hover:text-[#fff6e8]">
                {cta.label}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Decorative side, only on large screens */}
      <section className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#120905] lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(55% 50% at 30% 30%, color-mix(in oklab, #1f6f78 70%, transparent), transparent 70%)',
              'radial-gradient(50% 45% at 78% 72%, color-mix(in oklab, #ffc83d 22%, transparent), transparent 70%)',
              'radial-gradient(35% 35% at 62% 12%, color-mix(in oklab, #4ba0a9 30%, transparent), transparent 70%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,246,232,0.5) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-12 px-8 text-center">
          <Logo size="xl" tone="light" />

          {cta && (
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-8 py-8 backdrop-blur-sm">
              <p className="text-xl">{cta.text}</p>
              <Link
                to={cta.to}
                className="mt-5 inline-block rounded-sm border border-[#ffc83d] px-10 py-3 text-sm font-medium uppercase tracking-wide text-[#fff6e8] hover:bg-[#ffc83d]/15"
              >
                {cta.label}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}