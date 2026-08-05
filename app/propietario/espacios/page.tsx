"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo } from "react"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { formatMoneda } from "@/lib/format"
import { Plus, Pencil, CalendarClock, Building2, Users, MapPin, Power } from "lucide-react"

export default function MisEspaciosPage() {
  return (
    <Guard roles={["propietario"]}>
      <MisEspacios />
    </Guard>
  )
}

function MisEspacios() {
  const { usuarioActual, espacios, reservaciones, alternarEstadoEspacio } = useStore()

  const mios = useMemo(
    () => espacios.filter((e) => e.propietarioId === usuarioActual?.id),
    [espacios, usuarioActual],
  )

  function solicitudesPendientes(espacioId: string) {
    return reservaciones.filter((r) => r.espacioId === espacioId && r.estado === "pendiente").length
  }

  return (
    <PageShell>
      <PageHeader
        title="Mis espacios"
        description="Administra tus publicaciones, disponibilidad y estado."
        action={
          <Button render={<Link href="/propietario/espacios/nuevo" />}>
            <Plus data-icon="inline-start" />
            Publicar espacio
          </Button>
        }
      />

      {mios.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>Aún no tienes espacios</EmptyTitle>
            <EmptyDescription>
              Publica tu primer espacio para empezar a recibir reservaciones.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/propietario/espacios/nuevo" />}>
              <Plus data-icon="inline-start" />
              Publicar espacio
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {mios.map((e) => {
            const pend = solicitudesPendientes(e.id)
            return (
              <Card key={e.id} className="overflow-hidden py-0">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-square sm:w-40">
                    <Image
                      src={e.fotos[0] || "/placeholder.svg"}
                      alt={e.nombre}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold">{e.nombre}</h3>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {e.ciudad}
                        </p>
                      </div>
                      <StatusBadge estado={e.estado} />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatMoneda(e.precio)} / día</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {e.capacidad} personas
                      </span>
                      {pend > 0 && (
                        <span className="font-medium text-primary">
                          {pend} solicitud{pend !== 1 && "es"} pendiente{pend !== 1 && "s"}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/propietario/espacios/${e.id}/editar`} />}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/propietario/espacios/${e.id}/disponibilidad`} />}
                      >
                        <CalendarClock data-icon="inline-start" />
                        Disponibilidad
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alternarEstadoEspacio(e.id)}
                      >
                        <Power data-icon="inline-start" />
                        {e.estado === "activo" ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
