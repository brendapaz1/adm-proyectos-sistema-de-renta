"use client"

import { useMemo, useState } from "react"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { formatMoneda, formatFecha } from "@/lib/format"
import { Check, X, Inbox, CalendarDays, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import type { EstadoReservacion } from "@/lib/types"

const FILTROS: { value: string; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "todas", label: "Todas" },
]

export default function SolicitudesPage() {
  return (
    <Guard roles={["propietario"]}>
      <Solicitudes />
    </Guard>
  )
}

function Solicitudes() {
  const {
    usuarioActual,
    espacios,
    reservaciones,
    usuarios,
    aprobarReservacion,
    rechazarReservacion,
    solicitarIntencion,
    solicitarComentario,
  } = useStore()
  const [filtro, setFiltro] = useState("pendiente")

  const misEspaciosIds = useMemo(
    () => espacios.filter((e) => e.propietarioId === usuarioActual?.id).map((e) => e.id),
    [espacios, usuarioActual],
  )

  const solicitudes = useMemo(() => {
    let list = reservaciones.filter((r) => misEspaciosIds.includes(r.espacioId))
    if (filtro !== "todas") list = list.filter((r) => r.estado === (filtro as EstadoReservacion))
    return [...list].sort((a, b) => (a.creado < b.creado ? 1 : -1))
  }, [reservaciones, misEspaciosIds, filtro])

  function nombreEspacio(id: string) {
    return espacios.find((e) => e.id === id)?.nombre ?? "Espacio"
  }
  function cliente(id: string) {
    return usuarios.find((u) => u.id === id)
  }

  return (
    <PageShell>
      <PageHeader
        title="Solicitudes de reservación"
        description="Aprueba o rechaza las solicitudes de tus espacios."
      />

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as string)} className="mb-6">
        <TabsList>
          {FILTROS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {solicitudes.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Sin solicitudes</EmptyTitle>
            <EmptyDescription>
              No hay solicitudes {filtro !== "todas" ? "con este estado" : ""} por ahora.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {solicitudes.map((r) => {
            const c = cliente(r.clienteId)
            const iniciales = (c?.nombre ?? "??")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
            return (
              <Card key={r.id} className="py-0">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="text-xs">{iniciales}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium">{nombreEspacio(r.espacioId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {c?.nombre} · {c?.correo}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {r.inicio === r.fin
                          ? formatFecha(r.inicio)
                          : `${formatFecha(r.inicio)} – ${formatFecha(r.fin)}`}
                        {" · "}
                        {r.dias} {r.dias === 1 ? "día" : "días"}
                      </p>
                      <div className="mt-2 rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="mb-1 font-medium text-foreground">
                          Intención del evento
                        </p>
                        <p className="leading-relaxed text-muted-foreground">
                          {r.mensaje || "El cliente no agregó un mensaje."}
                        </p>
                        {!r.mensaje?.trim() && (
                          <div className="mt-2">
                            {r.intencionSolicitada ? (
                              <span className="text-xs font-medium text-primary">
                                Mensaje solicitado al cliente
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const resultado = solicitarIntencion(r.id)
                                  if (resultado.ok) {
                                    toast.success("Solicitud de mensaje enviada")
                                  } else {
                                    toast.error(resultado.error)
                                  }
                                }}
                              >
                                <MessageSquareText data-icon="inline-start" />
                                Solicitar mensaje
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {r.comentarioCliente && (
                        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                          <p className="mb-1 font-medium text-foreground">
                            Comentario del cliente
                          </p>
                          <p className="leading-relaxed text-muted-foreground">
                            {r.comentarioCliente}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="font-display text-lg font-semibold">
                      {formatMoneda(r.total)}
                    </span>
                    <StatusBadge estado={r.estado} />
                  </div>

                  {r.estado === "pendiente" && (
                    <div className="flex gap-2 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          aprobarReservacion(r.id)
                        }}
                      >
                        <Check data-icon="inline-start" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          rechazarReservacion(r.id)
                        }}
                      >
                        <X data-icon="inline-start" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                  {r.estado === "aprobada" && (
                    <div className="flex border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      {r.comentarioCliente ? (
                        <span className="text-sm font-medium text-primary">Comentario recibido</span>
                      ) : r.comentarioSolicitado ? (
                        <span className="text-sm text-muted-foreground">Comentario solicitado</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const resultado = solicitarComentario(r.id)
                            if (resultado.ok) toast.success("Solicitud de comentario enviada")
                            else toast.error(resultado.error)
                          }}
                        >
                          <MessageSquareText data-icon="inline-start" />
                          Solicitar comentario
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
