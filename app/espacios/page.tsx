"use client"

import { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { PageShell, PageHeader } from "@/components/page-shell"
import { SpaceCard } from "@/components/space-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/native-select"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { CIUDADES, TIPOS_ESPACIO } from "@/lib/types"
import { Search, SlidersHorizontal, MapPinOff } from "lucide-react"

export default function EspaciosPage() {
  return (
    <Suspense fallback={null}>
      <Catalogo />
    </Suspense>
  )
}

function Catalogo() {
  const params = useSearchParams()
  const { espacios } = useStore()

  const [q, setQ] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [tipo, setTipo] = useState("")
  const [precioMax, setPrecioMax] = useState("")
  const [capacidadMin, setCapacidadMin] = useState("")
  const [orden, setOrden] = useState("relevancia")

  useEffect(() => {
    setQ(params.get("q") ?? "")
    setCiudad(params.get("ciudad") ?? "")
    setTipo(params.get("tipo") ?? "")
  }, [params])

  const resultados = useMemo(() => {
    let list = espacios.filter((s) => s.estado === "activo")
    if (q) {
      const t = q.toLowerCase()
      list = list.filter(
        (s) =>
          s.nombre.toLowerCase().includes(t) ||
          s.descripcion.toLowerCase().includes(t) ||
          s.ciudad.toLowerCase().includes(t),
      )
    }
    if (ciudad) list = list.filter((s) => s.ciudad === ciudad)
    if (tipo) list = list.filter((s) => s.tipo === tipo)
    if (precioMax) list = list.filter((s) => s.precio <= Number(precioMax))
    if (capacidadMin) list = list.filter((s) => s.capacidad >= Number(capacidadMin))

    if (orden === "precio-asc") list = [...list].sort((a, b) => a.precio - b.precio)
    if (orden === "precio-desc") list = [...list].sort((a, b) => b.precio - a.precio)
    if (orden === "capacidad") list = [...list].sort((a, b) => b.capacidad - a.capacidad)
    return list
  }, [espacios, q, ciudad, tipo, precioMax, capacidadMin, orden])

  function limpiar() {
    setQ("")
    setCiudad("")
    setTipo("")
    setPrecioMax("")
    setCapacidadMin("")
    setOrden("relevancia")
  }

  return (
    <PageShell>
      <PageHeader
        title="Explorar espacios"
        description={`${resultados.length} ${resultados.length === 1 ? "espacio disponible" : "espacios disponibles"}`}
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="size-4" />
                Filtros
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Ciudad</span>
                <NativeSelect value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                  <option value="">Todas</option>
                  {CIUDADES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Tipo de espacio</span>
                <NativeSelect value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  {TIPOS_ESPACIO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Precio máx. por día</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Sin límite"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Capacidad mínima</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Cualquiera"
                  value={capacidadMin}
                  onChange={(e) => setCapacidadMin(e.target.value)}
                />
              </label>

              <Button variant="outline" onClick={limpiar}>
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        </aside>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {resultados.length} resultado{resultados.length !== 1 && "s"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ordenar:</span>
              <NativeSelect
                className="w-44"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="relevancia">Relevancia</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="capacidad">Mayor capacidad</option>
              </NativeSelect>
            </label>
          </div>

          {resultados.length === 0 ? (
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPinOff />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  No encontramos espacios con esos filtros. Prueba ampliando tu búsqueda.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {resultados.map((s) => (
                <SpaceCard key={s.id} espacio={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
