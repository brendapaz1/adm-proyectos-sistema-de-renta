import Link from "next/link"
import { Building2 } from "lucide-react"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          >
            <Building2 className="size-5" />
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground text-pretty">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">{children}</div>
        {footer && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
