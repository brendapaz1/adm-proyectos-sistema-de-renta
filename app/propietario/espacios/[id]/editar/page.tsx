"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Guard } from "@/components/guard"
import { PageShell, PageHeader } from "@/components/page-shell"
import { useStore } from "@/lib/store"
import { SpaceForm } from "@/components/space-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ArrowLeft, SearchX } from "lucide-react"

export default function EditarEspacioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Guard roles={["propietario"]}>
      <EditarEspacio id={params} />
    </Guard>
  )
}

function EditarEspacio({ id }: { id: Promise<{ id: string }> }) {
  const { id: espacioId } = use(id)
  const router = useRouter()
  const { usuarioActual, espacios, actualizarEspacio } = useStore()
  const espacio = espacios.find((e) => e.id === espacioId)

  if (!espacio || espacio.propietarioId !== usuarioActual?.id) {
    return (
      <PageShell className="max-w-3xl">
        <Empty className="min-h-[40vh] rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Espacio no encontrado</EmptyTitle>
            <EmptyDescription>No tienes acceso a este espacio o no existe.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/propietario/espacios" />}>Volver a mis espacios</Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

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
      <PageHeader title="Editar espacio" description={espacio.nombre} />
      <Card>
        <CardContent className="pt-6">
          <SpaceForm
            inicial={espacio}
            submitLabel="Guardar cambios"
            onCancel={() => router.push("/propietario/espacios")}
            onSubmit={(values) => {
              actualizarEspacio(espacio.id, values)
              toast.success("Espacio actualizado correctamente.")
              router.push("/propietario/espacios")
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
