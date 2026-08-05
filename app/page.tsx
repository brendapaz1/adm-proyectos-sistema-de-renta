"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { SpaceCard } from "@/components/space-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/native-select"
import { CIUDADES, TIPOS_ESPACIO } from "@/lib/types"
import { Search, MapPin, ShieldCheck, CalendarCheck, CreditCard, ArrowRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { espacios } = useStore()
  const [q, setQ] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [tipo, setTipo] = useState("")

  const destacados = espacios.filter((s) => s.estado === "activo").slice(0, 3)

  function buscar() {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (ciudad) params.set("ciudad", ciudad)
    if (tipo) params.set("tipo", tipo)
    router.push(`/espacios?${params.toString()}`)
  }

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              Espacios verificados en toda la ciudad
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-balance md:text-6xl">
              Encuentra el espacio ideal para cada ocasión
            </h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Renta salas de juntas, oficinas, salones de eventos y estudios por día. Reserva en
              minutos, paga seguro.
            </p>
          </div>

          <div className="mt-8 max-w-3xl rounded-2xl border bg-card p-3 shadow-sm">
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="¿Qué espacio buscas?"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscar()}
                />
              </div>
              <NativeSelect
                aria-label="Ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="md:w-40"
              >
                <option value="">Toda ciudad</option>
                {CIUDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="md:w-44"
              >
                <option value="">Todo tipo</option>
                {TIPOS_ESPACIO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </NativeSelect>
              <Button onClick={buscar}>
                <Search data-icon="inline-start" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "1. Explora",
              desc: "Filtra por ciudad, tipo, precio y capacidad hasta encontrar tu espacio.",
            },
            {
              icon: CalendarCheck,
              title: "2. Reserva",
              desc: "Elige las fechas disponibles y envía tu solicitud al propietario.",
            },
            {
              icon: CreditCard,
              title: "3. Paga seguro",
              desc: "Al aprobarse, paga de forma simulada y recibe tu confirmación.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Espacios destacados</h2>
            <p className="text-sm text-muted-foreground">Los favoritos de nuestra comunidad</p>
          </div>
          <Button variant="ghost" render={<Link href="/espacios" />}>
            Ver todos
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destacados.map((s) => (
            <SpaceCard key={s.id} espacio={s} />
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold">Reserva con confianza</h2>
          <p className="max-w-xl text-muted-foreground text-pretty">
            Usuarios y espacios verificados, pagos protegidos y soporte en cada reservación.
          </p>
          <Button className="mt-2" render={<Link href="/registro" />}>
            Crear cuenta gratis
          </Button>
        </div>
      </section>
    </div>
  )
}
