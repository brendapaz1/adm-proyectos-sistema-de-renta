"use client"

import { useState } from "react"
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldSet, FieldLegend } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect } from "@/components/native-select"
import { CIUDADES, TIPOS_ESPACIO, CARACTERISTICAS } from "@/lib/types"
import type { Espacio } from "@/lib/types"

export interface SpaceFormValues {
  nombre: string
  descripcion: string
  tipo: string
  ciudad: string
  direccion: string
  precio: number
  capacidad: number
  caracteristicas: string[]
  fotos: string[]
}

const FOTOS_DEMO = [
  "/spaces/sala-juntas.png",
  "/spaces/oficina-privada.png",
  "/spaces/salon-eventos.png",
  "/spaces/estudio-creativo.png",
  "/spaces/coworking.png",
  "/spaces/terraza.png",
]

type Errores = Partial<Record<keyof SpaceFormValues, string>>

export function SpaceForm({
  inicial,
  onSubmit,
  submitLabel = "Guardar",
  onCancel,
}: {
  inicial?: Espacio
  onSubmit: (values: SpaceFormValues) => void
  submitLabel?: string
  onCancel?: () => void
}) {
  const [form, setForm] = useState<SpaceFormValues>({
    nombre: inicial?.nombre ?? "",
    descripcion: inicial?.descripcion ?? "",
    tipo: inicial?.tipo ?? TIPOS_ESPACIO[0],
    ciudad: inicial?.ciudad ?? CIUDADES[0],
    direccion: inicial?.direccion ?? "",
    precio: inicial?.precio ?? 0,
    capacidad: inicial?.capacidad ?? 1,
    caracteristicas: inicial?.caracteristicas ?? [],
    fotos: inicial?.fotos ?? [FOTOS_DEMO[0]],
  })
  const [errores, setErrores] = useState<Errores>({})

  function set<K extends keyof SpaceFormValues>(campo: K, valor: SpaceFormValues[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function toggleCaracteristica(c: string) {
    setForm((f) => ({
      ...f,
      caracteristicas: f.caracteristicas.includes(c)
        ? f.caracteristicas.filter((x) => x !== c)
        : [...f.caracteristicas, c],
    }))
  }

  function validar(): Errores {
    const e: Errores = {}
    if (!form.nombre.trim()) e.nombre = "Ingresa un nombre."
    if (!form.descripcion.trim()) e.descripcion = "Agrega una descripción."
    if (!form.direccion.trim()) e.direccion = "Ingresa la dirección."
    if (!form.precio || form.precio <= 0) e.precio = "El precio debe ser mayor a 0."
    if (!form.capacidad || form.capacidad <= 0) e.capacidad = "La capacidad debe ser al menos 1."
    return e
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length > 0) return
    onSubmit(form)
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errores.nombre || undefined}>
          <FieldLabel htmlFor="nombre">Nombre del espacio</FieldLabel>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            aria-invalid={!!errores.nombre || undefined}
            placeholder="Sala de Juntas Centro"
          />
          {errores.nombre && (
            <FieldDescription className="text-destructive">{errores.nombre}</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errores.descripcion || undefined}>
          <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
          <Textarea
            id="descripcion"
            rows={4}
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            aria-invalid={!!errores.descripcion || undefined}
            placeholder="Describe el espacio, sus ventajas y para qué es ideal."
          />
          {errores.descripcion && (
            <FieldDescription className="text-destructive">{errores.descripcion}</FieldDescription>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
            <NativeSelect
              id="tipo"
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
            >
              {TIPOS_ESPACIO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
            <NativeSelect
              id="ciudad"
              value={form.ciudad}
              onChange={(e) => set("ciudad", e.target.value)}
            >
              {CIUDADES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <Field data-invalid={!!errores.direccion || undefined}>
          <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
          <Input
            id="direccion"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            aria-invalid={!!errores.direccion || undefined}
            placeholder="Av. Principal 123, Colonia"
          />
          {errores.direccion && (
            <FieldDescription className="text-destructive">{errores.direccion}</FieldDescription>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errores.precio || undefined}>
            <FieldLabel htmlFor="precio">Precio por día (MXN)</FieldLabel>
            <Input
              id="precio"
              type="number"
              min={0}
              value={form.precio || ""}
              onChange={(e) => set("precio", Number(e.target.value))}
              aria-invalid={!!errores.precio || undefined}
              placeholder="1200"
            />
            {errores.precio && (
              <FieldDescription className="text-destructive">{errores.precio}</FieldDescription>
            )}
          </Field>
          <Field data-invalid={!!errores.capacidad || undefined}>
            <FieldLabel htmlFor="capacidad">Capacidad (personas)</FieldLabel>
            <Input
              id="capacidad"
              type="number"
              min={1}
              value={form.capacidad || ""}
              onChange={(e) => set("capacidad", Number(e.target.value))}
              aria-invalid={!!errores.capacidad || undefined}
              placeholder="20"
            />
            {errores.capacidad && (
              <FieldDescription className="text-destructive">{errores.capacidad}</FieldDescription>
            )}
          </Field>
        </div>

        <FieldSet>
          <FieldLegend>Características</FieldLegend>
          <FieldDescription>Selecciona todo lo que incluye el espacio.</FieldDescription>
          <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
            {CARACTERISTICAS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.caracteristicas.includes(c)}
                  onCheckedChange={() => toggleCaracteristica(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </FieldSet>

        <Field>
          <FieldLabel>Foto de portada</FieldLabel>
          <FieldDescription>Elige una imagen de muestra para tu espacio.</FieldDescription>
          <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6">
            {FOTOS_DEMO.map((src) => {
              const activa = form.fotos[0] === src
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => set("fotos", [src])}
                  aria-pressed={activa}
                  className={
                    "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors " +
                    (activa ? "border-primary" : "border-transparent hover:border-border")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src || "/placeholder.svg"} alt="" className="size-full object-cover" />
                </button>
              )
            })}
          </div>
        </Field>

        <div className="flex gap-2">
          <Button type="submit">{submitLabel}</Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  )
}
