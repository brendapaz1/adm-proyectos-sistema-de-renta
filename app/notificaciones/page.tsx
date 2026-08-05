"use client"

import { useMemo } from "react"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Bell, CheckCheck, Calendar, CreditCard, ShieldCheck, XCircle, Inbox, MessageSquareText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFecha } from "@/lib/format"
import type { TipoNotificacion } from "@/lib/types"

const iconMap: Record<TipoNotificacion, typeof Bell> = {
  reservacion_aprobada: Calendar,
  reservacion_rechazada: XCircle,
  reservacion_cancelada: XCircle,
  nueva_solicitud: Inbox,
  pago_registrado: CreditCard,
  comentario_solicitado: MessageSquareText,
  intencion_solicitada: MessageSquareText,
  verificacion: ShieldCheck,
}

export default function NotificacionesPage() {
  return (
    <Guard roles={["cliente", "propietario", "admin"]}>
      <NotifContent />
    </Guard>
  )
}

function NotifContent() {
  const { usuarioActual, notificaciones, marcarTodasLeidas, marcarLeida } = useStore()

  const misNotifs = useMemo(
    () =>
      notificaciones
        .filter((n) => n.usuarioId === usuarioActual?.id)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [notificaciones, usuarioActual],
  )
  const hayNoLeidas = misNotifs.some((n) => !n.leida)

  return (
    <PageShell>
      <PageHeader
        title="Notificaciones"
        description="Mantente al tanto de tus reservaciones y pagos."
        action={
          <Button
            variant="outline"
            onClick={() => usuarioActual && marcarTodasLeidas(usuarioActual.id)}
            disabled={!hayNoLeidas}
          >
            <CheckCheck data-icon="inline-start" />
            Marcar todas como leídas
          </Button>
        }
      />
      {misNotifs.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>Sin notificaciones</EmptyTitle>
            <EmptyDescription>
              Aquí verás avisos sobre tus reservaciones, pagos y verificación.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {misNotifs.map((n) => {
            const Icon = iconMap[n.tipo]
            return (
              <Card
                key={n.id}
                className={cn(
                  "cursor-pointer py-0 transition-colors hover:bg-accent/40",
                  !n.leida && "border-primary/40 bg-primary/5",
                )}
                onClick={() => marcarLeida(n.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      n.leida ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm", !n.leida && "font-medium")}>{n.mensaje}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatFecha(n.fecha)}</p>
                  </div>
                  {!n.leida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
