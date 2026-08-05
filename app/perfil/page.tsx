"use client"

import { useState } from "react"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { BadgeCheck, ShieldAlert, ShieldCheck, Upload } from "lucide-react"

const rolLabel: Record<string, string> = {
  cliente: "Cliente",
  propietario: "Propietario",
  admin: "Administrador",
}

export default function PerfilPage() {
  return (
    <Guard roles={["cliente", "propietario", "admin"]}>
      <PerfilContent />
    </Guard>
  )
}

function PerfilContent() {
  const { usuarioActual, actualizarPerfil, enviarVerificacion } = useStore()
  const [nombre, setNombre] = useState(usuarioActual?.nombre ?? "")
  const [telefono, setTelefono] = useState(usuarioActual?.telefono ?? "")

  if (!usuarioActual) return null

  function guardar() {
    actualizarPerfil({ nombre, telefono })
    toast.success("Perfil actualizado")
  }

  const iniciales = usuarioActual.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <PageShell>
      <PageHeader
        title="Mi perfil"
        description="Administra tu información personal y verifica tu identidad."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Actualiza tus datos de contacto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 pb-6">
                <Avatar size="lg">
                  <AvatarFallback>{iniciales}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{usuarioActual.nombre}</p>
                  <p className="text-sm text-muted-foreground">{usuarioActual.correo}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {rolLabel[usuarioActual.rol]}
                </Badge>
              </div>
              <Separator className="mb-6" />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nombre">Nombre completo</FieldLabel>
                  <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="correo">Correo electrónico</FieldLabel>
                  <Input id="correo" value={usuarioActual.correo} disabled />
                  <FieldDescription>El correo no se puede modificar.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="tel">Teléfono</FieldLabel>
                  <Input
                    id="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="33 1234 5678"
                  />
                </Field>
                <Field orientation="horizontal">
                  <Button onClick={guardar}>Guardar cambios</Button>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Verificación de identidad</CardTitle>
              <CardDescription>Requerida para reservar y publicar espacios.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {usuarioActual.verificacion === "aprobada" ? (
                <Alert>
                  <ShieldCheck />
                  <AlertTitle>Identidad verificada</AlertTitle>
                  <AlertDescription>
                    Tu cuenta está verificada. Ya puedes reservar y publicar.
                  </AlertDescription>
                </Alert>
              ) : usuarioActual.verificacion === "pendiente" ? (
                <Alert>
                  <ShieldAlert />
                  <AlertTitle>Verificación en proceso</AlertTitle>
                  <AlertDescription>
                    Estamos revisando tus documentos. Te avisaremos pronto.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert variant="destructive">
                    <ShieldAlert />
                    <AlertTitle>
                      {usuarioActual.verificacion === "rechazada" ? "Verificación rechazada" : "Sin verificar"}
                    </AlertTitle>
                    <AlertDescription>
                      Sube una identificación oficial para verificar tu cuenta.
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    onClick={() => {
                      enviarVerificacion("ine-simulada.pdf")
                      toast.success("Documento enviado. Verificación en proceso.")
                    }}
                  >
                    <Upload data-icon="inline-start" />
                    Subir identificación
                  </Button>
                </>
              )}
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <BadgeCheck className="size-4 shrink-0 text-primary" />
                <span>La verificación protege a toda la comunidad.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
