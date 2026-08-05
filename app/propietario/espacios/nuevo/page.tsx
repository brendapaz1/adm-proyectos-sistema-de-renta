"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { SpaceForm } from "@/components/space-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NuevoEspacioPage() {
  return (
    <Guard roles={["propietario"]}>
      <NuevoEspacio />
    </Guard>
  )
}

function NuevoEspacio() {
  const router = useRouter()
  const { publicarEspacio } = useStore()

  return (
    <PageShell className="max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        render={<Link href="/propietario/espacios" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Volver a mis espacios
      </Button>
      <PageHeader
        title="Publicar espacio"
        description="Completa los datos para poner tu espacio disponible."
      />
      <Card>
        <CardContent className="pt-6">
          <SpaceForm
            submitLabel="Publicar espacio"
            onCancel={() => router.push("/propietario/espacios")}
            onSubmit={(values) => {
              const res = publicarEspacio(values)
              if (!res.ok) {
                toast.error(res.error ?? "No fue posible publicar el espacio.")
                return
              }
              toast.success("Espacio publicado correctamente.")
              router.push("/propietario/espacios")
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
