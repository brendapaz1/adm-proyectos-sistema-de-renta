"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NativeSelect } from "@/components/native-select"
import { StatusBadge } from "@/components/status-badge"
import { formatMoneda } from "@/lib/format"
import { CIUDADES } from "@/lib/types"
import { EyeIcon, PowerIcon } from "lucide-react"
import Link from "next/link"

export default function AdminEspaciosPage() {
  return (
    <Guard roles={["admin"]}>
      <Contenido />
    </Guard>
  )
}

function Contenido() {
  const { espacios, usuarios, alternarEstadoEspacio } = useStore()
  const [ciudad, setCiudad] = useState("todas")

  const lista = useMemo(() => {
    return espacios
      .filter((e) => (ciudad === "todas" ? true : e.ciudad === ciudad))
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [espacios, ciudad])

  const nombrePropietario = (id: string) =>
    usuarios.find((u) => u.id === id)?.nombre ?? "—"

  return (
    <PageShell>
      <PageHeader
        title="Gestión de espacios"
        description="Supervisa y modera todos los espacios publicados en la plataforma."
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Ciudad:</span>
        <NativeSelect
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="w-56"
        >
          <option value="todas">Todas</option>
          {CIUDADES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Precio/día</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={e.fotos[0] || "/placeholder.svg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.tipo}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {nombrePropietario(e.propietarioId)}
                  </TableCell>
                  <TableCell className="text-sm">{e.ciudad}</TableCell>
                  <TableCell className="text-sm">
                    {formatMoneda(e.precio)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={e.estado} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" render={
                        <Link href={`/espacios/${e.id}`} />
                      }>
                        <EyeIcon data-icon="inline-start" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alternarEstadoEspacio(e.id)}
                      >
                        <PowerIcon data-icon="inline-start" />
                        {e.estado === "activo" ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
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
