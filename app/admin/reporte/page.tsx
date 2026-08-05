"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useStore } from "@/lib/store"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatMoneda } from "@/lib/format"
import {
  UsersIcon,
  BuildingIcon,
  CalendarCheckIcon,
  BanknoteIcon,
} from "lucide-react"

const chartConfig = {
  reservaciones: { label: "Reservaciones", color: "var(--chart-1)" },
  ingresos: { label: "Ingresos", color: "var(--chart-2)" },
} satisfies ChartConfig

export default function AdminReportePage() {
  return (
    <Guard roles={["admin"]}>
      <Contenido />
    </Guard>
  )
}

function Contenido() {
  const { usuarios, espacios, reservaciones, pagos } = useStore()

  const kpis = useMemo(() => {
    const clientes = usuarios.filter((u) => u.rol === "cliente").length
    const propietarios = usuarios.filter((u) => u.rol === "propietario").length
    const ingresos = pagos.reduce((s, p) => s + p.monto, 0)
    const aprobadas = reservaciones.filter(
      (r) => r.estado === "aprobada",
    ).length
    return {
      usuarios: usuarios.length,
      clientes,
      propietarios,
      espacios: espacios.length,
      espaciosActivos: espacios.filter((e) => e.estado === "activo").length,
      reservaciones: reservaciones.length,
      aprobadas,
      ingresos,
    }
  }, [usuarios, espacios, reservaciones, pagos])

  const porTipo = useMemo(() => {
    const mapa = new Map<string, { reservaciones: number; ingresos: number }>()
    for (const e of espacios) {
      if (!mapa.has(e.tipo)) mapa.set(e.tipo, { reservaciones: 0, ingresos: 0 })
    }
    for (const r of reservaciones) {
      const esp = espacios.find((e) => e.id === r.espacioId)
      if (!esp) continue
      const cur = mapa.get(esp.tipo) ?? { reservaciones: 0, ingresos: 0 }
      cur.reservaciones += 1
      if (r.pagoId) cur.ingresos += r.total
      mapa.set(esp.tipo, cur)
    }
    return Array.from(mapa.entries()).map(([tipo, v]) => ({
      tipo: tipo.length > 12 ? tipo.slice(0, 11) + "…" : tipo,
      ...v,
    }))
  }, [espacios, reservaciones])

  return (
    <PageShell>
      <PageHeader
        title="Reporte general"
        description="Métricas clave de la actividad de la plataforma."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<UsersIcon className="size-5" />}
          label="Usuarios"
          value={kpis.usuarios}
          detalle={`${kpis.clientes} clientes · ${kpis.propietarios} propietarios`}
        />
        <KpiCard
          icon={<BuildingIcon className="size-5" />}
          label="Espacios"
          value={kpis.espacios}
          detalle={`${kpis.espaciosActivos} activos`}
        />
        <KpiCard
          icon={<CalendarCheckIcon className="size-5" />}
          label="Reservaciones"
          value={kpis.reservaciones}
          detalle={`${kpis.aprobadas} aprobadas`}
        />
        <KpiCard
          icon={<BanknoteIcon className="size-5" />}
          label="Ingresos"
          value={formatMoneda(kpis.ingresos)}
          detalle="Pagos simulados"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actividad por tipo de espacio</CardTitle>
          <CardDescription>
            Reservaciones e ingresos agrupados por categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart accessibilityLayer data={porTipo}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="tipo"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="reservaciones"
                fill="var(--color-reservaciones)"
                radius={4}
              />
              <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </PageShell>
  )
}

function KpiCard({
  icon,
  label,
  value,
  detalle,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  detalle: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  )
}
