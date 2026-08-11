"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { useStore } from "@/lib/store"
import type { Rol } from "@/lib/types"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const DESTINO: Record<Rol, string> = {
  cliente: "/",
  propietario: "/propietario/espacios",
  admin: "/admin/reporte",
}

export default function LoginPage() {
  const { iniciarSesion, usuarios } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!correo || !password) {
      setError("Completa todos los campos.")
      return
    }
    const res = iniciarSesion(correo, password)
    if (!res.ok) {
      setError(res.error ?? "No fue posible iniciar sesión.")
      return
    }
    const user = usuarios.find(
      (u) => u.correo.toLowerCase() === correo.toLowerCase(),
    )
    const next = searchParams.get("next")
    toast.success("Sesión iniciada correctamente.")
    router.push(next || (user ? DESTINO[user.rol] : "/"))
  }

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede a tu cuenta para reservar o administrar espacios."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="correo">Correo</FieldLabel>
            <Input
              id="correo"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={!!error || undefined}
            />
          </Field>
          <Field data-invalid={!!error || undefined}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Link
                href="/recuperar"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error || undefined}
            />
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}
          </Field>
          <Button type="submit" className="w-full" size="lg">
            Iniciar sesión
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-5 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1.5 font-medium text-foreground">Cuentas de prueba</p>
        <ul className="flex flex-col gap-0.5">
          <li>Cliente: cliente@espacios.mx / cliente123</li>
          <li>Propietario: propietario@espacios.mx / prop123</li>
          <li>Admin: admin@espacios.mx / admin123</li>
        </ul>
      </div>
    </AuthShell>
  )
}
