"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Briefcase, UserRound } from "lucide-react"

import { useStore } from "@/lib/store"
import type { Rol } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

interface Errores {
  [k: string]: string | undefined
}

export default function RegistroPage() {
  const { registrar } = useStore()
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    password: "",
    confirmar: "",
  })
  const [rol, setRol] = useState<Rol>("cliente")
  const [errores, setErrores] = useState<Errores>({})

  function set(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function validar(): Errores {
    const e: Errores = {}
    if (!form.nombre.trim()) e.nombre = "Ingresa tu nombre."
    if (!form.correo.trim()) e.correo = "Ingresa tu correo."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      e.correo = "El formato del correo no es válido."
    if (!form.telefono.trim()) e.telefono = "Ingresa tu teléfono."
    if (!form.password) e.password = "Crea una contraseña."
    else if (form.password.length < 6)
      e.password = "La contraseña debe tener al menos 6 caracteres."
    if (form.confirmar !== form.password)
      e.confirmar = "Las contraseñas no coinciden."
    return e
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const res = registrar({
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      password: form.password,
      rol,
    })
    if (!res.ok) {
      setErrores({ correo: res.error })
      return
    }
    toast.success("Cuenta creada correctamente.")
    router.push(rol === "propietario" ? "/propietario/espacios" : "/")
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Regístrate para reservar o publicar espacios."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errores.nombre || undefined}>
            <FieldLabel htmlFor="nombre">Nombre completo</FieldLabel>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              aria-invalid={!!errores.nombre || undefined}
              placeholder="Ana López"
            />
            {errores.nombre && (
              <FieldDescription className="text-destructive">
                {errores.nombre}
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errores.correo || undefined}>
            <FieldLabel htmlFor="correo">Correo</FieldLabel>
            <Input
              id="correo"
              type="email"
              value={form.correo}
              onChange={(e) => set("correo", e.target.value)}
              aria-invalid={!!errores.correo || undefined}
              placeholder="tucorreo@ejemplo.com"
            />
            {errores.correo && (
              <FieldDescription className="text-destructive">
                {errores.correo}
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errores.telefono || undefined}>
            <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
            <Input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              aria-invalid={!!errores.telefono || undefined}
              placeholder="33 1234 5678"
            />
            {errores.telefono && (
              <FieldDescription className="text-destructive">
                {errores.telefono}
              </FieldDescription>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errores.password || undefined}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                aria-invalid={!!errores.password || undefined}
                placeholder="••••••••"
              />
              {errores.password && (
                <FieldDescription className="text-destructive">
                  {errores.password}
                </FieldDescription>
              )}
            </Field>
            <Field data-invalid={!!errores.confirmar || undefined}>
              <FieldLabel htmlFor="confirmar">Confirmar</FieldLabel>
              <Input
                id="confirmar"
                type="password"
                value={form.confirmar}
                onChange={(e) => set("confirmar", e.target.value)}
                aria-invalid={!!errores.confirmar || undefined}
                placeholder="••••••••"
              />
              {errores.confirmar && (
                <FieldDescription className="text-destructive">
                  {errores.confirmar}
                </FieldDescription>
              )}
            </Field>
          </div>

          <Field>
            <FieldLabel>Tipo de cuenta</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    valor: "cliente" as Rol,
                    titulo: "Cliente",
                    desc: "Busca y reserva",
                    icon: UserRound,
                  },
                  {
                    valor: "propietario" as Rol,
                    titulo: "Propietario",
                    desc: "Publica espacios",
                    icon: Briefcase,
                  },
                ]
              ).map((opt) => {
                const activo = rol === opt.valor
                const Icon = opt.icon
                return (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => setRol(opt.valor)}
                    aria-pressed={activo}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                      activo
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        activo ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-medium">{opt.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </Field>

          <Button type="submit" className="w-full" size="lg">
            Crear cuenta
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
