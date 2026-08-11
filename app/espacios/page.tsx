"use client"

import { use, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useStore, diasEntre } from "@/lib/store"
import { PageShell } from "@/components/page-shell"
import { formatMoneda, formatFecha } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import {
  MapPin,
  Users,
  Check,
  CalendarDays,
  ArrowLeft,
  ShieldAlert,
  SearchX,
} from "lucide-react"

export default function EspacioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { espacios } = useStore()
  const espacio = espacios.find((e) => e.id === id)

  if (!espacio || espacio.estado !== "activo") {
    return (
      <PageShell>
        <Empty className="min-h-[50vh] rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Espacio no disponible</EmptyTitle>
            <EmptyDescription>
              Este espacio no existe o ya no está publicado.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/espacios" />}>Ver otros espacios</Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        render={<Link href="/espacios" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Volver al catálogo
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted">
            <Image
              src={espacio.fotos[0] || "/placeholder.svg"}
              alt={espacio.nombre}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
            <Badge className="absolute left-4 top-4 bg-background/90 text-foreground backdrop-blur">
              {espacio.tipo}
            </Badge>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
              {espacio.nombre}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {espacio.direccion}, {espacio.ciudad}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                Hasta {espacio.capacidad} personas
              </span>
            </div>
          </div>

          <Separator />

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold">Descripción</h2>
            <p className="leading-relaxed text-muted-foreground text-pretty">
              {espacio.descripcion}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Características</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {espacio.caracteristicas.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <Check className="size-4 text-primary" />
                  {c}
                </div>
              ))}
            </div>
          </section>

          {espacio.bloqueos.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Fechas no disponibles</h2>
              <div className="flex flex-wrap gap-2">
                {espacio.bloqueos.map((b) => (
                  <Badge key={b.id} variant="secondary">
                    {b.inicio === b.fin
                      ? formatFecha(b.inicio)
                      : `${formatFecha(b.inicio)} – ${formatFecha(b.fin)}`}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <ReservarWidget espacioId={espacio.id} precio={espacio.precio} />
        </div>
      </div>
    </PageShell>
  )
}

function ReservarWidget({ espacioId, precio }: { espacioId: string; precio: number }) {
  const router = useRouter()
  const { usuarioActual, solicitarReservacion, espacioDisponible } = useStore()
  const [inicio, setInicio] = useState("")
  const [fin, setFin] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [enviando, setEnviando] = useState(false)

  const rangoValido = inicio && fin && inicio <= fin
  const dias = rangoValido ? diasEntre(inicio, fin) : 0
  const total = dias * precio
  const disponible = rangoValido ? espacioDisponible(espacioId, inicio, fin) : true

  const puedeReservar = usuarioActual?.rol === "cliente"
  const verificado = usuarioActual?.verificacion === "aprobada"
  const mensajeValido = mensaje.trim().length >= 10

  function reservar(e?: React.FormEvent) {
    e?.preventDefault()
    if (!usuarioActual) {
      router.push(`/login?next=${encodeURIComponent(`/espacios/${espacioId}`)}`)
      return
    }
    if (!rangoValido) {
      toast.error("Selecciona un rango de fechas válido.")
      return
    }
    if (!disponible) {
      toast.error("Las fechas seleccionadas no están disponibles.")
      return
    }
    if (!puedeReservar) {
      toast.error("Solo las cuentas de cliente pueden solicitar reservaciones.")
      return
    }
    if (!mensajeValido) {
      toast.error("Describe la intención del evento con al menos 10 caracteres.")
      return
    }
    setEnviando(true)
    const res = solicitarReservacion(espacioId, inicio, fin, mensaje)
    setEnviando(false)
    if (!res.ok) {
      toast.error(res.error ?? "No fue posible enviar la solicitud.")
      return
    }
    setInicio("")
    setFin("")
    setMensaje("")
    toast.success("Solicitud enviada. Espera la aprobación del propietario.")
    router.push("/reservaciones")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-1">
          <span className="font-display text-2xl">{formatMoneda(precio)}</span>
          <span className="text-sm font-normal text-muted-foreground">/ día</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={reservar}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Desde</span>
            <input
              type="date"
              value={inicio}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setInicio(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Hasta</span>
            <input
              type="date"
              value={fin}
              min={inicio || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFin(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Intención del evento</span>
          <Textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Cuéntale al propietario qué evento realizarás y para cuántas personas."
            minLength={10}
            maxLength={500}
            rows={4}
            aria-describedby="mensaje-ayuda"
          />
          <span
            id="mensaje-ayuda"
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>Mínimo 10 caracteres.</span>
            <span>{mensaje.length}/500</span>
          </span>
        </label>

        {rangoValido && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatMoneda(precio)} × {dias} {dias === 1 ? "día" : "días"}
              </span>
              <span>{formatMoneda(total)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span>{formatMoneda(total)}</span>
            </div>
          </div>
        )}

        {rangoValido && !disponible && (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>No disponible</AlertTitle>
            <AlertDescription>
              Esas fechas no están disponibles. Prueba con otro rango.
            </AlertDescription>
          </Alert>
        )}

        {usuarioActual && !puedeReservar && (
          <Alert>
            <ShieldAlert />
            <AlertTitle>Solo clientes pueden reservar</AlertTitle>
            <AlertDescription>
              Inicia sesión con una cuenta de cliente para reservar este espacio.
            </AlertDescription>
          </Alert>
        )}

        {usuarioActual && puedeReservar && !verificado && (
          <Alert>
            <ShieldAlert />
            <AlertTitle>Verifica tu identidad</AlertTitle>
            <AlertDescription>
              Recomendamos verificar tu identidad desde tu perfil antes de reservar.
            </AlertDescription>
          </Alert>
        )}

        {!usuarioActual ? (
          <Button
            className="w-full"
            size="lg"
            render={<Link href={`/login?next=${encodeURIComponent(`/espacios/${espacioId}`)}`} />}
          >
            Inicia sesión para reservar
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={enviando || !puedeReservar}
          >
            {enviando ? (
              <>
                <Spinner data-icon="inline-start" />
                Enviando solicitud...
              </>
            ) : (
              "Solicitar reservación"
            )}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          No se te cobrará hasta que el propietario apruebe.
        </p>
        </form>
      </CardContent>
    </Card>
  )
}

