export type Rol = "cliente" | "propietario" | "admin"

export type EstadoVerificacion =
  | "no_enviada"
  | "pendiente"
  | "aprobada"
  | "rechazada"

export type EstadoUsuario = "activo" | "suspendido"

export interface Usuario {
  id: string
  nombre: string
  correo: string
  telefono: string
  password: string
  rol: Rol
  estado: EstadoUsuario
  verificacion: EstadoVerificacion
  documento?: string
  avatar?: string
}

export type EstadoEspacio = "activo" | "inactivo"

export interface Bloqueo {
  id: string
  inicio: string // ISO date (yyyy-mm-dd)
  fin: string
}

export interface Espacio {
  id: string
  propietarioId: string
  nombre: string
  descripcion: string
  tipo: string
  ciudad: string
  direccion: string
  precio: number
  capacidad: number
  caracteristicas: string[]
  fotos: string[]
  estado: EstadoEspacio
  bloqueos: Bloqueo[]
  creado: string
}

export type EstadoReservacion =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "cancelada"

export interface Reservacion {
  id: string
  espacioId: string
  clienteId: string
  inicio: string
  fin: string
  dias: number
  total: number
  mensaje: string
  intencionSolicitada?: boolean
  comentarioSolicitado?: boolean
  comentarioCliente?: string
  estado: EstadoReservacion
  pagoId?: string
  creado: string
}

export type EstadoPago = "pagado"

export interface Pago {
  id: string
  reservacionId: string
  monto: number
  estado: EstadoPago
  fecha: string
}

export type TipoNotificacion =
  | "reservacion_aprobada"
  | "reservacion_rechazada"
  | "reservacion_cancelada"
  | "pago_registrado"
  | "nueva_solicitud"
  | "comentario_solicitado"
  | "intencion_solicitada"
  | "verificacion"

export interface Notificacion {
  id: string
  usuarioId: string
  mensaje: string
  tipo: TipoNotificacion
  leida: boolean
  fecha: string
}

export const CIUDADES = [
  "Guadalajara",
  "Monterrey",
  "Ciudad de México",
] as const

export const TIPOS_ESPACIO = [
  "Sala de juntas",
  "Oficina privada",
  "Salón de eventos",
  "Estudio creativo",
  "Coworking",
  "Terraza",
]

export const CARACTERISTICAS = [
  "WiFi",
  "Estacionamiento",
  "Baños",
  "Aire acondicionado",
  "Mobiliario",
  "Proyector",
  "Cocina",
  "Accesibilidad",
]
