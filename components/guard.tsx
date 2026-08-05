"use client"

import Link from "next/link"
import { useStore } from "@/lib/store"
import type { Rol } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Lock } from "lucide-react"
import { PageShell } from "@/components/page-shell"

export function Guard({
  roles,
  children,
}: {
  roles: Rol[]
  children: React.ReactNode
}) {
  const { hydrated, usuarioActual } = useStore()

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!usuarioActual) {
    return (
      <PageShell>
        <Empty className="min-h-[50vh] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>Inicia sesión para continuar</EmptyTitle>
            <EmptyDescription>
              Necesitas una cuenta para acceder a esta sección.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button render={<Link href="/login" />}>Iniciar sesión</Button>
              <Button variant="outline" render={<Link href="/registro" />}>
                Registrarse
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

  if (!roles.includes(usuarioActual.rol)) {
    return (
      <PageShell>
        <Empty className="min-h-[50vh] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>Acceso restringido</EmptyTitle>
            <EmptyDescription>
              Tu rol ({usuarioActual.rol}) no tiene permiso para ver esta
              sección.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/" />}>Ir al inicio</Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

  return <>{children}</>
}
