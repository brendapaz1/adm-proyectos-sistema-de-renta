import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Estado =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "cancelada"
  | "pagado"
  | "no_pagado"
  | "activo"
  | "inactivo"
  | "suspendido"
  | "no_enviada"

const CONFIG: Record<Estado, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  },
  aprobada: {
    label: "Aprobada",
    className: "bg-primary/12 text-primary border-primary/25",
  },
  rechazada: {
    label: "Rechazada",
    className: "bg-destructive/12 text-destructive border-destructive/25",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground border-border",
  },
  pagado: {
    label: "Pagado",
    className: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  },
  no_pagado: {
    label: "Sin pagar",
    className: "bg-muted text-muted-foreground border-border",
  },
  activo: {
    label: "Activo",
    className: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground border-border",
  },
  suspendido: {
    label: "Suspendido",
    className: "bg-destructive/12 text-destructive border-destructive/25",
  },
  no_enviada: {
    label: "No enviada",
    className: "bg-muted text-muted-foreground border-border",
  },
}

export function StatusBadge({
  estado,
  className,
}: {
  estado: Estado
  className?: string
}) {
  const cfg = CONFIG[estado]
  return (
    <Badge variant="outline" className={cn(cfg.className, className)}>
      {cfg.label}
    </Badge>
  )
}
