import Link from "next/link"
import Image from "next/image"
import { MapPin, Users } from "lucide-react"

import type { Espacio } from "@/lib/types"
import { formatMoneda } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function SpaceCard({ espacio }: { espacio: Espacio }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={espacio.fotos[0] || "/placeholder.svg"}
          alt={espacio.nombre}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
          {espacio.tipo}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-semibold leading-tight text-balance">
            {espacio.nombre}
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {espacio.ciudad}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="size-3.5" />
          Hasta {espacio.capacidad} personas
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <span className="font-display text-lg font-semibold text-foreground">
              {formatMoneda(espacio.precio)}
            </span>
            <span className="text-sm text-muted-foreground"> / día</span>
          </div>
          <Button size="sm" render={<Link href={`/espacios/${espacio.id}`} />}>
            Ver espacio
          </Button>
        </div>
      </div>
    </div>
  )
}
