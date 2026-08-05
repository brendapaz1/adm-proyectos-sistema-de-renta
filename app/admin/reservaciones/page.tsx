"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { NativeSelect } from "@/components/native-select"
import { StatusBadge } from "@/components/status-badge"
import { formatMoneda, rangoFechas } from "@/lib/format"
import type { EstadoReservacion } from "@/lib/types"

export default function AdminReservacionesPage() {
  return (
    <Guard roles={["admin"]}>
      <Contenido />
    </Guard>
  )
}

function Contenido() {
  const { reservaciones, espacios, usuarios } = useStore()
  const [estado, setEstado] = useState("todas")

  const lista = useMemo(() => {
    return reservaciones
      .filter((r) => (estado === "todas" ? true : r.estado === estado))
      .slice()
      .sort((a, b) => (a.creado < b.creado ? 1 : -1))
  }, [reservaciones, estado])

  const espacioNombre = (id: string) =>
    espacios.find((e) => e.id === id)?.nombre ?? "—"
  const clienteNombre = (id: string) =>
    usuarios.find((u) => u.id === id)?.nombre ?? "—"

  return (
    <PageShell>
      <PageHeader
        title="Reservaciones y pagos"
        description="Historial completo de reservaciones y su estado de pago."
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Estado:</span>
        <NativeSelect
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-48"
        >
          <option value="todas">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>
        </NativeSelect>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {espacioNombre(r.espacioId)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {clienteNombre(r.clienteId)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rangoFechas(r.inicio, r.fin)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatMoneda(r.total)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={r.estado as EstadoReservacion} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={r.pagoId ? "pagado" : "no_pagado"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  )
}
