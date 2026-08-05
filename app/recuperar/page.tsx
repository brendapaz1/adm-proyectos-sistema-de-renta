"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { useStore } from "@/lib/store"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export default function RecuperarPage() {
  const { recuperar } = useStore()
  const [correo, setCorreo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!correo) {
      setError("Ingresa tu correo.")
      return
    }
    const res = recuperar(correo)
    if (!res.ok) {
      setError(res.error ?? "No fue posible procesar la solicitud.")
      return
    }
    setEnviado(true)
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos instrucciones para restablecer tu acceso."
      footer={
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      {enviado ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-chart-2" />
          <p className="text-sm text-muted-foreground text-pretty">
            Si <span className="font-medium text-foreground">{correo}</span>{" "}
            está registrado, enviamos un enlace de recuperación (simulado) a esa
            dirección.
          </p>
          <Button render={<Link href="/login" />} className="mt-2 w-full">
            Entendido
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="correo">Correo</FieldLabel>
              <Input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                aria-invalid={!!error || undefined}
                placeholder="tucorreo@ejemplo.com"
              />
              {error && (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              )}
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Enviar instrucciones
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
