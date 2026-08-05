"use client"

import { use, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { formatFecha } from "@/lib/format"
import { ArrowLeft, SearchX, CalendarOff, Trash2, CalendarCheck } from "lucide-react"

export default function DisponibilidadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Guard roles={["propietario"]}>
      <Disponibilidad params={params} />
    </Guard>
  )
}

function Disponibilidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { usuarioActual, espacios, reservaciones, bloquearFechas, eliminarBloqueo } = useStore()
  const espacio = espacios.find((e) => e.id === id)

  const [inicio, setInicio] = useState("")
  const [fin, setFin] = useState("")

  if (!espacio || espacio.propietarioId !== usuarioActual?.id) {
    return (
      <PageShell className="max-w-3xl">
        <Empty className="min-h-[40vh] rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Espacio no encontrado</EmptyTitle>
            <EmptyDescription>No tienes acceso a este espacio o no existe.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/propietario/espacios" />}>Volver a mis espacios</Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

  const reservasAprobadas = reservaciones.filter(
    (r) => r.espacioId === espacio.id && r.estado === "aprobada",
  )

  function agregarBloqueo() {
    const res = bloquearFechas(espacio!.id, inicio, fin)
    if (!res.ok) {
      toast.error(res.error ?? "No fue posible bloquear las fechas.")
      return
    }
    toast.success("Fechas bloqueadas.")
    setInicio("")
    setFin("")
  }

  const inputClass =
    "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

  return (
    <PageShell className="max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        render={<Link href="/propietario/espacios" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Volver a mis espacios
      </Button>
      <PageHeader title="Disponibilidad" description={espacio.nombre} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bloquear fechas</CardTitle>
            <CardDescription>
              Marca periodos en los que el espacio no estará disponible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Desde</span>
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Hasta</span>
                <input
                  type="date"
                  value={fin}
                  min={inicio || undefined}
                  onChange={(e) => setFin(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <Button onClick={agregarBloqueo} disabled={!inicio || !fin}>
              <CalendarOff data-icon="inline-start" />
              Bloquear fechas
            </Button>

            <div className="flex flex-col gap-2 pt-2">
              <p className="text-sm font-medium">Fechas bloqueadas</p>
              {espacio.bloqueos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay fechas bloqueadas.</p>
              ) : (
                espacio.bloqueos.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span>
                      {b.inicio === b.fin
                        ? formatFecha(b.inicio)
                        : `${formatFecha(b.inicio)} – ${formatFecha(b.fin)}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => eliminarBloqueo(espacio.id, b.id)}
                      aria-label="Eliminar bloqueo"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reservaciones aprobadas</CardTitle>
            <CardDescription>Fechas ya ocupadas por clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            {reservasAprobadas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <CalendarCheck className="size-6" />
                Sin reservaciones aprobadas todavía.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {reservasAprobadas.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span>
                      {r.inicio === r.fin
                        ? formatFecha(r.inicio)
                        : `${formatFecha(r.inicio)} – ${formatFecha(r.fin)}`}
                    </span>
                    <StatusBadge estado={r.pagoId ? "pagado" : "aprobada"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
