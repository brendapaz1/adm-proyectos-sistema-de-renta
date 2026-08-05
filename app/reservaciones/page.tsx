"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { PaymentDialog } from "@/components/payment-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { formatMoneda, formatFecha } from "@/lib/format"
import { CalendarDays, CreditCard, X, CalendarX2, Receipt } from "lucide-react"
import type { Reservacion } from "@/lib/types"
import { toast } from "sonner"

const FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "cancelada", label: "Canceladas" },
]

export default function ReservacionesPage() {
  return (
    <Guard roles={["cliente"]}>
      <MisReservaciones />
    </Guard>
  )
}

function MisReservaciones() {
  const {
    usuarioActual,
    reservaciones,
    espacios,
    pagos,
    cancelarReservacion,
    enviarIntencion,
    enviarComentario,
  } = useStore()
  const [filtro, setFiltro] = useState("todas")
  const [intenciones, setIntenciones] = useState<Record<string, string>>({})
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [pagoOpen, setPagoOpen] = useState(false)
  const [reservaPago, setReservaPago] = useState<Reservacion | null>(null)

  const mias = useMemo(() => {
    let list = reservaciones.filter((r) => r.clienteId === usuarioActual?.id)
    if (filtro !== "todas") list = list.filter((r) => r.estado === filtro)
    return [...list].sort((a, b) => (a.creado < b.creado ? 1 : -1))
  }, [reservaciones, usuarioActual, filtro])

  function espacio(id: string) {
    return espacios.find((e) => e.id === id)
  }
  function pagoDe(reservaId: string) {
    return pagos.find((p) => p.reservacionId === reservaId)
  }

  function abrirPago(r: Reservacion) {
    setReservaPago(r)
    setPagoOpen(true)
  }

  return (
    <PageShell>
      <PageHeader
        title="Mis reservaciones"
        description="Consulta el estado de tus reservaciones y realiza tus pagos."
        action={
          <Button variant="outline" render={<Link href="/espacios" />}>
            Explorar espacios
          </Button>
        }
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

      {mias.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarX2 />
            </EmptyMedia>
            <EmptyTitle>Sin reservaciones</EmptyTitle>
            <EmptyDescription>
              Cuando reserves un espacio, aparecerá aquí con su estado.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/espacios" />}>Explorar espacios</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {mias.map((r) => {
            const e = espacio(r.espacioId)
            const pago = pagoDe(r.id)
            return (
              <Card key={r.id} className="overflow-hidden py-0">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-square sm:w-32">
                    <Image
                      src={e?.fotos[0] || "/placeholder.svg"}
                      alt={e?.nombre ?? "Espacio"}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/espacios/${r.espacioId}`}
                        className="font-display font-semibold hover:underline"
                      >
                        {e?.nombre ?? "Espacio"}
                      </Link>
                      <StatusBadge estado={r.estado} />
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {r.inicio === r.fin
                        ? formatFecha(r.inicio)
                        : `${formatFecha(r.inicio)} – ${formatFecha(r.fin)}`}
                      {" · "}
                      {r.dias} {r.dias === 1 ? "día" : "días"}
                    </p>
                    <p className="font-display text-lg font-semibold">{formatMoneda(r.total)}</p>
                    {r.mensaje && (
                      <div className="rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="mb-1 font-medium text-foreground">
                          Intención del evento
                        </p>
                        <p className="leading-relaxed text-muted-foreground">
                          {r.mensaje}
                        </p>
                      </div>
                    )}
                    {!r.mensaje?.trim() && r.intencionSolicitada && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <p className="font-medium text-foreground">
                          Agrega la intención del evento
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          El propietario necesita saber qué evento realizarás.
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                          <Textarea
                            value={intenciones[r.id] ?? ""}
                            onChange={(event) =>
                              setIntenciones((actuales) => ({
                                ...actuales,
                                [r.id]: event.target.value,
                              }))
                            }
                            placeholder="Describe el evento y para cuántas personas será..."
                            minLength={10}
                            maxLength={500}
                            rows={3}
                            aria-label="Intención del evento"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {(intenciones[r.id] ?? "").length}/500
                            </span>
                            <Button
                              size="sm"
                              disabled={(intenciones[r.id] ?? "").trim().length < 10}
                              onClick={() => {
                                const resultado = enviarIntencion(
                                  r.id,
                                  intenciones[r.id] ?? "",
                                )
                                if (resultado.ok) {
                                  toast.success("Intención del evento enviada")
                                  setIntenciones((actuales) => ({
                                    ...actuales,
                                    [r.id]: "",
                                  }))
                                } else {
                                  toast.error(resultado.error)
                                }
                              }}
                            >
                              Enviar mensaje
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {r.comentarioSolicitado && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <p className="mb-1 font-medium text-foreground">
                          Comentario solicitado
                        </p>
                        {r.comentarioCliente ? (
                          <p className="leading-relaxed text-muted-foreground">
                            {r.comentarioCliente}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <p className="text-muted-foreground">
                              El propietario quiere conocer tu experiencia.
                            </p>
                            <Textarea
                              value={comentarios[r.id] ?? ""}
                              onChange={(event) =>
                                setComentarios((actuales) => ({
                                  ...actuales,
                                  [r.id]: event.target.value,
                                }))
                              }
                              placeholder="Cuéntale cómo fue tu experiencia..."
                              minLength={10}
                              maxLength={500}
                              rows={3}
                              aria-label="Comentario sobre tu experiencia"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">
                                {(comentarios[r.id] ?? "").length}/500
                              </span>
                              <Button
                                size="sm"
                                disabled={(comentarios[r.id] ?? "").trim().length < 10}
                                onClick={() => {
                                  const resultado = enviarComentario(
                                    r.id,
                                    comentarios[r.id] ?? "",
                                  )
                                  if (resultado.ok) {
                                    toast.success("Comentario enviado")
                                    setComentarios((actuales) => ({ ...actuales, [r.id]: "" }))
                                  } else {
                                    toast.error(resultado.error)
                                  }
                                }}
                              >
                                Enviar comentario
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                      {r.estado === "aprobada" && !pago && (
                        <Button size="sm" onClick={() => abrirPago(r)}>
                          <CreditCard data-icon="inline-start" />
                          Pagar ahora
                        </Button>
                      )}
                      {pago && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Receipt className="size-4 text-chart-2" />
                          Pagado el {formatFecha(pago.fecha)}
                        </span>
                      )}
                      {(r.estado === "pendiente" || r.estado === "aprobada") && !pago && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => cancelarReservacion(r.id)}
                        >
                          <X data-icon="inline-start" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PaymentDialog
        reservacion={reservaPago}
        espacioNombre={reservaPago ? (espacio(reservaPago.espacioId)?.nombre ?? "Espacio") : ""}
        open={pagoOpen}
        onOpenChange={setPagoOpen}
      />
    </PageShell>
  )
}
