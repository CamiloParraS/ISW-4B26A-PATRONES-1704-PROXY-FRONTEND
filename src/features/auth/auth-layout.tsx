import { Link } from "react-router-dom"

export function AuthLayout({
  title,
  subtitle,
  children,
  alternateAction,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  alternateAction: {
    text: string
    linkText: string
    to: string
  }
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(15,23,42,0.05),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[36px_36px] opacity-15" />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg
          viewBox="0 0 600 400"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-[-12%] right-[-8%] h-[60vh] w-[60vh] opacity-30 blur-2xl"
          aria-hidden
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <g fill="none" fillRule="evenodd">
            <circle cx="220" cy="140" r="220" fill="url(#g1)" />
            <circle cx="520" cy="360" r="140" fill="url(#g2)" opacity="0.9" />
            <circle cx="680" cy="80" r="60" fill="#60a5fa" opacity="0.6" />
          </g>
        </svg>
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
            <header className="mb-4 text-center">
              <h1 className="text-2xl font-semibold text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </header>
            {children}
            <p className="mt-6 text-xs text-muted-foreground">
              {alternateAction.text}{" "}
              <Link
                className="font-semibold text-foreground underline underline-offset-4"
                to={alternateAction.to}
              >
                {alternateAction.linkText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
