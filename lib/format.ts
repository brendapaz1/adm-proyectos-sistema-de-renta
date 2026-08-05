export function formatMoneda(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  })
}

export function formatFecha(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function rangoFechas(inicio: string, fin: string) {
  if (inicio === fin) return formatFecha(inicio)
  return `${formatFecha(inicio)} – ${formatFecha(fin)}`
}

export function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}
