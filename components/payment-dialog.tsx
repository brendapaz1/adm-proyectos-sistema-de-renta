"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { formatMoneda } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { CreditCard, Lock } from "lucide-react"
import type { Reservacion } from "@/lib/types"

export function PaymentDialog({
  reservacion,
  espacioNombre,
  open,
  onOpenChange,
}: {
  reservacion: Reservacion | null
  espacioNombre: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { pagarReservacion } = useStore()
  const [numero, setNumero] = useState("")
  const [venc, setVenc] = useState("")
  const [cvv, setCvv] = useState("")
  const [nombre, setNombre] = useState("")
  const [procesando, setProcesando] = useState(false)

  const numeroValido = numero.replace(/\s/g, "").length >= 15
  const formValido = numeroValido && venc.length >= 4 && cvv.length >= 3 && nombre.trim().length > 0

  function formatNumero(v: string) {
    const limpio = v.replace(/\D/g, "").slice(0, 16)
    return limpio.replace(/(.{4})/g, "$1 ").trim()
  }

  function pagar() {
    if (!reservacion || !formValido) return
    setProcesando(true)
    // Simulación de pasarela de pago
    setTimeout(() => {
      const res = pagarReservacion(reservacion.id)
      setProcesando(false)
      if (!res.ok) {
        toast.error(res.error ?? "No fue posible procesar el pago.")
        return
      }
      toast.success("Pago realizado correctamente.")
      onOpenChange(false)
      setNumero("")
      setVenc("")
      setCvv("")
      setNombre("")
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago de reservación</DialogTitle>
          <DialogDescription>
            {espacioNombre} — {reservacion ? formatMoneda(reservacion.total) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5" />
            Pago simulado — no se realizará ningún cargo real.
          </span>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="card">Número de tarjeta</FieldLabel>
            <Input
              id="card"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={numero}
              onChange={(e) => setNumero(formatNumero(e.target.value))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="venc">Vencimiento</FieldLabel>
              <Input
                id="venc"
                placeholder="MM/AA"
                value={venc}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setVenc(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v)
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cvv">CVV</FieldLabel>
              <Input
                id="cvv"
                inputMode="numeric"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="titular">Titular</FieldLabel>
            <Input
              id="titular"
              placeholder="Nombre en la tarjeta"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={procesando}>
            Cancelar
          </Button>
          <Button onClick={pagar} disabled={!formValido || procesando}>
            {procesando ? (
              <>
                <Spinner data-icon="inline-start" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard data-icon="inline-start" />
                Pagar {reservacion ? formatMoneda(reservacion.total) : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
