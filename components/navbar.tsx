"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Building2,
  Bell,
  LogOut,
  Menu as MenuIcon,
  User as UserIcon,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Rol } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavLink {
  href: string
  label: string
}

const LINKS: Record<Rol | "invitado", NavLink[]> = {
  invitado: [{ href: "/", label: "Buscar espacios" }],
  cliente: [
    { href: "/", label: "Buscar" },
    { href: "/reservaciones", label: "Mis reservaciones" },
    { href: "/notificaciones", label: "Notificaciones" },
  ],
  propietario: [
    { href: "/propietario/espacios", label: "Mis espacios" },
    { href: "/propietario/reservaciones", label: "Solicitudes" },
    { href: "/notificaciones", label: "Notificaciones" },
  ],
  admin: [
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/espacios", label: "Espacios" },
    { href: "/admin/reservaciones", label: "Reservaciones" },
    { href: "/admin/reporte", label: "Reporte" },
  ],
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export function Navbar() {
  const { usuarioActual, cerrarSesion, notificaciones } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const rol = usuarioActual?.rol ?? "invitado"
  const links = LINKS[rol]

  const sinLeer = usuarioActual
    ? notificaciones.filter((n) => n.usuarioId === usuarioActual.id && !n.leida)
        .length
    : 0

  function salir() {
    cerrarSesion()
    setOpen(false)
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Espacios
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {l.label}
                  {l.href === "/notificaciones" && sinLeer > 0 && (
                    <Badge className="h-4 min-w-4 px-1 text-[10px]">
                      {sinLeer}
                    </Badge>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {usuarioActual ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {iniciales(usuarioActual.nombre)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {usuarioActual.nombre}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {usuarioActual.rol}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/perfil")}>
                    <UserIcon />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/notificaciones")}
                  >
                    <Bell />
                    Notificaciones
                    {sinLeer > 0 && (
                      <Badge className="ml-auto h-4 min-w-4 px-1 text-[10px]">
                        {sinLeer}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={salir}>
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Iniciar sesión
              </Button>
              <Button size="sm" render={<Link href="/registro" />}>
                Registrarse
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menú"
        >
          {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
                {l.href === "/notificaciones" && sinLeer > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px]">{sinLeer}</Badge>
                )}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3">
              {usuarioActual ? (
                <>
                  <Link
                    href="/perfil"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Perfil ({usuarioActual.nombre})
                  </Link>
                  <Button variant="outline" size="sm" onClick={salir}>
                    <LogOut data-icon="inline-start" />
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href="/login" onClick={() => setOpen(false)} />}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    size="sm"
                    render={
                      <Link href="/registro" onClick={() => setOpen(false)} />
                    }
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
