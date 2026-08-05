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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { NativeSelect } from "@/components/native-select"
import { StatusBadge } from "@/components/status-badge"
import { iniciales } from "@/lib/format"
import type { Rol } from "@/lib/types"
import { CheckIcon, XIcon, ShieldOffIcon, ShieldCheckIcon } from "lucide-react"

const ROL_LABEL: Record<Rol, string> = {
  cliente: "Cliente",
  propietario: "Propietario",
  admin: "Administrador",
}

export default function AdminUsuariosPage() {
  return (
    <Guard roles={["admin"]}>
      <Contenido />
    </Guard>
  )
}

function Contenido() {
  const {
    usuarios,
    suspenderUsuario,
    reactivarUsuario,
    resolverVerificacion,
  } = useStore()
  const [filtroRol, setFiltroRol] = useState<string>("todos")

  const lista = useMemo(() => {
    return usuarios
      .filter((u) => (filtroRol === "todos" ? true : u.rol === filtroRol))
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [usuarios, filtroRol])

  const pendientes = usuarios.filter((u) => u.verificacion === "pendiente")

  return (
    <PageShell>
      <PageHeader
        title="Gestión de usuarios"
        description="Administra cuentas, roles y verificaciones de identidad."
      />

      {pendientes.length > 0 && (
        <Card className="mb-6 border-primary/40 bg-accent/40">
          <CardContent className="flex flex-col gap-3 pt-6">
            <p className="text-sm font-medium">
              {pendientes.length} verificación(es) de identidad pendiente(s)
            </p>
            <div className="flex flex-col gap-2">
              {pendientes.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.documento ?? "Documento no adjunto"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => resolverVerificacion(u.id, "aprobada")}
                    >
                      <CheckIcon data-icon="inline-start" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolverVerificacion(u.id, "rechazada")}
                    >
                      <XIcon data-icon="inline-start" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por rol:</span>
        <NativeSelect
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="w-48"
        >
          <option value="todos">Todos</option>
          <option value="cliente">Clientes</option>
          <option value="propietario">Propietarios</option>
          <option value="admin">Administradores</option>
        </NativeSelect>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Verificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback>{iniciales(u.nombre)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.correo}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROL_LABEL[u.rol]}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.estado === "activo" ? (
                      <Badge variant="outline">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Suspendido</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={u.verificacion} />
                  </TableCell>
                  <TableCell className="text-right">
                    {u.rol !== "admin" &&
                      (u.estado === "activo" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suspenderUsuario(u.id)}
                        >
                          <ShieldOffIcon data-icon="inline-start" />
                          Suspender
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reactivarUsuario(u.id)}
                        >
                          <ShieldCheckIcon data-icon="inline-start" />
                          Reactivar
                        </Button>
                      ))}
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
