"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react"
import type {
  Espacio,
  EstadoVerificacion,
  Notificacion,
  Pago,
  Reservacion,
  Rol,
  Usuario,
} from "./types"
import {
  espaciosSeed,
  notificacionesSeed,
  pagosSeed,
  reservacionesSeed,
  usuariosSeed,
} from "./mock-data"

const STORAGE_KEY = "espacios-mvp-v1"

interface DBShape {
  usuarios: Usuario[]
  espacios: Espacio[]
  reservaciones: Reservacion[]
  pagos: Pago[]
  notificaciones: Notificacion[]
  sesionId: string | null
}

type Resultado = { ok: boolean; error?: string; id?: string }

interface Store {
  hydrated: boolean
  usuarioActual: Usuario | null
  usuarios: Usuario[]
  espacios: Espacio[]
  reservaciones: Reservacion[]
  pagos: Pago[]
  notificaciones: Notificacion[]
  registrar: (data: Omit<Usuario, "id" | "estado" | "verificacion">) => Resultado
  iniciarSesion: (correo: string, password: string) => Resultado
  cerrarSesion: () => void
  recuperar: (correo: string) => Resultado
  actualizarPerfil: (data: Pick<Usuario, "nombre" | "telefono">) => void
  enviarVerificacion: (documento: string) => void
  publicarEspacio: (
    data: Omit<Espacio, "id" | "propietarioId" | "estado" | "bloqueos" | "creado">,
  ) => Resultado
  actualizarEspacio: (id: string, data: Partial<Espacio>) => void
  alternarEstadoEspacio: (id: string) => void
  bloquearFechas: (espacioId: string, inicio: string, fin: string) => Resultado
  eliminarBloqueo: (espacioId: string, bloqueoId: string) => void
  solicitarReservacion: (
    espacioId: string,
    inicio: string,
    fin: string,
    mensaje: string,
  ) => Resultado
  aprobarReservacion: (id: string) => void
  rechazarReservacion: (id: string) => void
  cancelarReservacion: (id: string) => void
  pagarReservacion: (id: string) => Resultado
  solicitarIntencion: (id: string) => Resultado
  enviarIntencion: (id: string, mensaje: string) => Resultado
  solicitarComentario: (id: string) => Resultado
  enviarComentario: (id: string, comentario: string) => Resultado
  suspenderUsuario: (id: string) => void
  reactivarUsuario: (id: string) => void
  resolverVerificacion: (id: string, estado: EstadoVerificacion) => void
  marcarLeida: (id: string) => void
  marcarTodasLeidas: (usuarioId: string) => void
  espacioDisponible: (
    espacioId: string,
    inicio: string,
    fin: string,
    ignorarReservacionId?: string,
  ) => boolean
}

type Action =
  | { type: "hydrate"; payload: DBShape }
  | { type: "registrar"; payload: { usuario: Usuario } }
  | { type: "iniciarSesion"; payload: { sesionId: string } }
  | { type: "cerrarSesion" }
  | {
      type: "actualizarPerfil"
      payload: { sesionId: string; data: Pick<Usuario, "nombre" | "telefono"> }
    }
  | {
      type: "enviarVerificacion"
      payload: { sesionId: string; documento: string }
    }
  | { type: "publicarEspacio"; payload: { espacio: Espacio } }
  | { type: "actualizarEspacio"; payload: { id: string; data: Partial<Espacio> } }
  | { type: "alternarEstadoEspacio"; payload: { id: string } }
  | {
      type: "bloquearFechas"
      payload: { espacioId: string; bloqueo: Espacio["bloqueos"][number] }
    }
  | {
      type: "eliminarBloqueo"
      payload: { espacioId: string; bloqueoId: string }
    }
  | {
      type: "solicitarReservacion"
      payload: { reservacion: Reservacion; notificacion: Notificacion }
    }
  | {
      type: "cambiarEstadoReservacion"
      payload: { id: string; estado: Reservacion["estado"]; notificaciones: Notificacion[] }
    }
  | {
      type: "pagarReservacion"
      payload: { id: string; pago: Pago; notificacion: Notificacion }
    }
  | {
      type: "solicitarIntencion"
      payload: { id: string; notificacion: Notificacion }
    }
  | { type: "enviarIntencion"; payload: { id: string; mensaje: string } }
  | {
      type: "solicitarComentario"
      payload: { id: string; notificacion: Notificacion }
    }
  | { type: "enviarComentario"; payload: { id: string; comentario: string } }
  | { type: "suspenderUsuario"; payload: { id: string } }
  | { type: "reactivarUsuario"; payload: { id: string } }
  | {
      type: "resolverVerificacion"
      payload: { id: string; estado: EstadoVerificacion; notificacion: Notificacion }
    }
  | { type: "marcarLeida"; payload: { id: string } }
  | { type: "marcarTodasLeidas"; payload: { usuarioId: string } }

const StoreContext = createContext<Store | null>(null)

function seed(): DBShape {
  return {
    usuarios: usuariosSeed,
    espacios: espaciosSeed,
    reservaciones: reservacionesSeed,
    pagos: pagosSeed,
    notificaciones: notificacionesSeed,
    sesionId: null,
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DBShape
  } catch {
    return null
  }
}

function writeStorage(db: DBShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignore persistence failures
  }
}

function reducer(state: DBShape, action: Action): DBShape {
  switch (action.type) {
    case "hydrate":
      return action.payload
    case "registrar":
      return {
        ...state,
        usuarios: [...state.usuarios, action.payload.usuario],
        sesionId: action.payload.usuario.id,
      }
    case "iniciarSesion":
      return { ...state, sesionId: action.payload.sesionId }
    case "cerrarSesion":
      return { ...state, sesionId: null }
    case "actualizarPerfil":
      return {
        ...state,
        usuarios: state.usuarios.map((u) =>
          u.id === action.payload.sesionId ? { ...u, ...action.payload.data } : u,
        ),
      }
    case "enviarVerificacion":
      return {
        ...state,
        usuarios: state.usuarios.map((u) =>
          u.id === action.payload.sesionId
            ? {
                ...u,
                verificacion: "pendiente" as EstadoVerificacion,
                documento: action.payload.documento,
              }
            : u,
        ),
      }
    case "publicarEspacio":
      return {
        ...state,
        espacios: [...state.espacios, action.payload.espacio],
      }
    case "actualizarEspacio":
      return {
        ...state,
        espacios: state.espacios.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.data } : e,
        ),
      }
    case "alternarEstadoEspacio":
      return {
        ...state,
        espacios: state.espacios.map((e) =>
          e.id === action.payload.id
            ? { ...e, estado: e.estado === "activo" ? "inactivo" : "activo" }
            : e,
        ),
      }
    case "bloquearFechas":
      return {
        ...state,
        espacios: state.espacios.map((e) =>
          e.id === action.payload.espacioId
            ? { ...e, bloqueos: [...e.bloqueos, action.payload.bloqueo] }
            : e,
        ),
      }
    case "eliminarBloqueo":
      return {
        ...state,
        espacios: state.espacios.map((e) =>
          e.id === action.payload.espacioId
            ? {
                ...e,
                bloqueos: e.bloqueos.filter((b) => b.id !== action.payload.bloqueoId),
              }
            : e,
        ),
      }
    case "solicitarReservacion":
      return {
        ...state,
        reservaciones: [...state.reservaciones, action.payload.reservacion],
        notificaciones: [action.payload.notificacion, ...state.notificaciones],
      }
    case "cambiarEstadoReservacion":
      return {
        ...state,
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id ? { ...r, estado: action.payload.estado } : r,
        ),
        notificaciones: [...action.payload.notificaciones, ...state.notificaciones],
      }
    case "pagarReservacion":
      return {
        ...state,
        pagos: [...state.pagos, action.payload.pago],
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id ? { ...r, pagoId: action.payload.pago.id } : r,
        ),
        notificaciones: [action.payload.notificacion, ...state.notificaciones],
      }
    case "solicitarIntencion":
      return {
        ...state,
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id ? { ...r, intencionSolicitada: true } : r,
        ),
        notificaciones: [action.payload.notificacion, ...state.notificaciones],
      }
    case "enviarIntencion":
      return {
        ...state,
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id ? { ...r, mensaje: action.payload.mensaje } : r,
        ),
      }
    case "solicitarComentario":
      return {
        ...state,
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id ? { ...r, comentarioSolicitado: true } : r,
        ),
        notificaciones: [action.payload.notificacion, ...state.notificaciones],
      }
    case "enviarComentario":
      return {
        ...state,
        reservaciones: state.reservaciones.map((r) =>
          r.id === action.payload.id
            ? { ...r, comentarioCliente: action.payload.comentario }
            : r,
        ),
      }
    case "suspenderUsuario":
      return {
        ...state,
        usuarios: state.usuarios.map((u) =>
          u.id === action.payload.id ? { ...u, estado: "suspendido" } : u,
        ),
      }
    case "reactivarUsuario":
      return {
        ...state,
        usuarios: state.usuarios.map((u) =>
          u.id === action.payload.id ? { ...u, estado: "activo" } : u,
        ),
      }
    case "resolverVerificacion":
      return {
        ...state,
        usuarios: state.usuarios.map((u) =>
          u.id === action.payload.id
            ? { ...u, verificacion: action.payload.estado }
            : u,
        ),
        notificaciones: [action.payload.notificacion, ...state.notificaciones],
      }
    case "marcarLeida":
      return {
        ...state,
        notificaciones: state.notificaciones.map((n) =>
          n.id === action.payload.id ? { ...n, leida: true } : n,
        ),
      }
    case "marcarTodasLeidas":
      return {
        ...state,
        notificaciones: state.notificaciones.map((n) =>
          n.usuarioId === action.payload.usuarioId ? { ...n, leida: true } : n,
        ),
      }
    default:
      return state
  }
}

export function diasEntre(inicio: string, fin: string) {
  const a = new Date(inicio + "T00:00:00").getTime()
  const b = new Date(fin + "T00:00:00").getTime()
  const dias = Math.floor((b - a) / 86400000) + 1
  return dias
}

function traslapa(aI: string, aF: string, bI: string, bF: string) {
  return aI <= bF && bI <= aF
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, dispatch] = useReducer(reducer, undefined, seed)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const persisted = readStorage()
    if (persisted) {
      dispatch({ type: "hydrate", payload: persisted })
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStorage(db)
  }, [db, hydrated])

  const usuarioActual = useMemo(
    () => db.usuarios.find((u) => u.id === db.sesionId) ?? null,
    [db.usuarios, db.sesionId],
  )

  const espacioDisponible = useCallback(
    (
      espacioId: string,
      inicio: string,
      fin: string,
      ignorarReservacionId?: string,
    ) => {
      const espacio = db.espacios.find((e) => e.id === espacioId)
      if (!espacio || inicio > fin) return false
      for (const bloqueo of espacio.bloqueos) {
        if (traslapa(inicio, fin, bloqueo.inicio, bloqueo.fin)) return false
      }
      const aprobadas = db.reservaciones.filter(
        (r) =>
          r.espacioId === espacioId &&
          r.estado === "aprobada" &&
          r.id !== ignorarReservacionId,
      )
      for (const reservacion of aprobadas) {
        if (traslapa(inicio, fin, reservacion.inicio, reservacion.fin)) return false
      }
      return true
    },
    [db.espacios, db.reservaciones],
  )

  const registrar: Store["registrar"] = useCallback((data) => {
    const existe = db.usuarios.some(
      (u) => u.correo.toLowerCase() === data.correo.toLowerCase(),
    )
    if (existe) {
      return { ok: false, error: "Ya existe una cuenta con este correo." }
    }
    const usuario: Usuario = {
      ...data,
      id: uid("u"),
      estado: "activo",
      verificacion: "no_enviada",
    }
    dispatch({ type: "registrar", payload: { usuario } })
    return { ok: true, id: usuario.id }
  }, [db.usuarios])

  const iniciarSesion: Store["iniciarSesion"] = useCallback(
    (correo, password) => {
      const usuario = db.usuarios.find(
        (u) => u.correo.toLowerCase() === correo.toLowerCase(),
      )
      if (!usuario || usuario.password !== password) {
        return { ok: false, error: "Correo o contraseña incorrectos." }
      }
      if (usuario.estado === "suspendido") {
        return { ok: false, error: "Tu cuenta está suspendida." }
      }
      dispatch({ type: "iniciarSesion", payload: { sesionId: usuario.id } })
      return { ok: true, id: usuario.id }
    },
    [db.usuarios],
  )

  const cerrarSesion = useCallback(() => {
    dispatch({ type: "cerrarSesion" })
  }, [])

  const recuperar: Store["recuperar"] = useCallback(
    (correo) => {
      const existe = db.usuarios.some(
        (u) => u.correo.toLowerCase() === correo.toLowerCase(),
      )
      if (!existe) {
        return { ok: false, error: "No encontramos una cuenta con ese correo." }
      }
      return { ok: true }
    },
    [db.usuarios],
  )

  const actualizarPerfil: Store["actualizarPerfil"] = useCallback(
    (data) => {
      if (!db.sesionId) return
      dispatch({
        type: "actualizarPerfil",
        payload: { sesionId: db.sesionId, data },
      })
    },
    [db.sesionId],
  )

  const enviarVerificacion: Store["enviarVerificacion"] = useCallback(
    (documento) => {
      if (!db.sesionId) return
      dispatch({
        type: "enviarVerificacion",
        payload: { sesionId: db.sesionId, documento },
      })
    },
    [db.sesionId],
  )

  const publicarEspacio: Store["publicarEspacio"] = useCallback(
    (data) => {
      if (!db.sesionId) {
        return { ok: false, error: "Sesión no válida." }
      }
      const espacio: Espacio = {
        ...data,
        id: uid("e"),
        propietarioId: db.sesionId,
        estado: "activo",
        bloqueos: [],
        creado: hoy(),
      }
      dispatch({ type: "publicarEspacio", payload: { espacio } })
      return { ok: true, id: espacio.id }
    },
    [db.sesionId],
  )

  const actualizarEspacio: Store["actualizarEspacio"] = useCallback((id, data) => {
    dispatch({ type: "actualizarEspacio", payload: { id, data } })
  }, [])

  const alternarEstadoEspacio: Store["alternarEstadoEspacio"] = useCallback((id) => {
    dispatch({ type: "alternarEstadoEspacio", payload: { id } })
  }, [])

  const bloquearFechas: Store["bloquearFechas"] = useCallback((espacioId, inicio, fin) => {
    if (!inicio || !fin) {
      return { ok: false, error: "Selecciona ambas fechas." }
    }
    if (inicio > fin) {
      return {
        ok: false,
        error: "La fecha de inicio no puede ser posterior a la fecha fin.",
      }
    }
    dispatch({
      type: "bloquearFechas",
      payload: { espacioId, bloqueo: { id: uid("b"), inicio, fin } },
    })
    return { ok: true }
  }, [])

  const eliminarBloqueo: Store["eliminarBloqueo"] = useCallback((espacioId, bloqueoId) => {
    dispatch({ type: "eliminarBloqueo", payload: { espacioId, bloqueoId } })
  }, [])

  const solicitarReservacion: Store["solicitarReservacion"] = useCallback(
    (espacioId, inicio, fin, mensaje) => {
      if (!db.sesionId) {
        return { ok: false, error: "Inicia sesión para reservar." }
      }
      const espacio = db.espacios.find((e) => e.id === espacioId)
      if (!espacio) {
        return { ok: false, error: "Espacio no encontrado." }
      }
      if (!inicio || !fin) {
        return { ok: false, error: "Selecciona las fechas de la reservación." }
      }
      if (inicio > fin) {
        return {
          ok: false,
          error: "La fecha de inicio no puede ser posterior a la fecha fin.",
        }
      }
      const intencion = mensaje.trim()
      if (intencion.length < 10) {
        return {
          ok: false,
          error: "Describe la intención del evento con al menos 10 caracteres.",
        }
      }
      if (intencion.length > 500) {
        return {
          ok: false,
          error: "El mensaje no puede superar los 500 caracteres.",
        }
      }
      if (!espacioDisponible(espacioId, inicio, fin)) {
        return { ok: false, error: "No disponible para las fechas seleccionadas." }
      }
      const reservacion: Reservacion = {
        id: uid("r"),
        espacioId,
        clienteId: db.sesionId,
        inicio,
        fin,
        dias: diasEntre(inicio, fin),
        total: diasEntre(inicio, fin) * espacio.precio,
        mensaje: intencion,
        estado: "pendiente",
        creado: hoy(),
      }
      const notificacion: Notificacion = {
        id: uid("n"),
        usuarioId: espacio.propietarioId,
        mensaje: `Recibiste una nueva solicitud para ${espacio.nombre}.`,
        tipo: "nueva_solicitud",
        leida: false,
        fecha: hoy(),
      }
      dispatch({
        type: "solicitarReservacion",
        payload: { reservacion, notificacion },
      })
      return { ok: true, id: reservacion.id }
    },
    [db.espacios, db.sesionId, espacioDisponible],
  )

  const cambiarEstadoReservacion = useCallback(
    (id: string, estado: Reservacion["estado"]) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      if (!reserva) return
      const espacio = db.espacios.find((e) => e.id === reserva.espacioId)
      const notificaciones: Notificacion[] = []
      if (estado === "aprobada") {
        notificaciones.push({
          id: uid("n"),
          usuarioId: reserva.clienteId,
          mensaje: `Tu reservación de ${espacio?.nombre ?? "espacio"} fue aprobada.`,
          tipo: "reservacion_aprobada",
          leida: false,
          fecha: hoy(),
        })
      } else if (estado === "rechazada") {
        notificaciones.push({
          id: uid("n"),
          usuarioId: reserva.clienteId,
          mensaje: `Tu reservación de ${espacio?.nombre ?? "espacio"} fue rechazada.`,
          tipo: "reservacion_rechazada",
          leida: false,
          fecha: hoy(),
        })
      } else if (estado === "cancelada" && espacio) {
        notificaciones.push({
          id: uid("n"),
          usuarioId: espacio.propietarioId,
          mensaje: `El cliente canceló una reservación de ${espacio.nombre}.`,
          tipo: "reservacion_cancelada",
          leida: false,
          fecha: hoy(),
        })
      }
      dispatch({
        type: "cambiarEstadoReservacion",
        payload: { id, estado, notificaciones },
      })
    },
    [db.espacios, db.reservaciones],
  )

  const aprobarReservacion = useCallback(
    (id: string) => cambiarEstadoReservacion(id, "aprobada"),
    [cambiarEstadoReservacion],
  )
  const rechazarReservacion = useCallback(
    (id: string) => cambiarEstadoReservacion(id, "rechazada"),
    [cambiarEstadoReservacion],
  )
  const cancelarReservacion = useCallback(
    (id: string) => cambiarEstadoReservacion(id, "cancelada"),
    [cambiarEstadoReservacion],
  )

  const pagarReservacion: Store["pagarReservacion"] = useCallback(
    (id) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      if (!reserva) {
        return { ok: false, error: "Reservación no encontrada." }
      }
      if (reserva.estado !== "aprobada") {
        return { ok: false, error: "Solo puedes pagar reservaciones aprobadas." }
      }
      if (reserva.pagoId) {
        return { ok: false, error: "Esta reservación ya fue pagada." }
      }
      const pago: Pago = {
        id: uid("p"),
        reservacionId: reserva.id,
        monto: reserva.total,
        estado: "pagado",
        fecha: hoy(),
      }
      const notificacion: Notificacion = {
        id: uid("n"),
        usuarioId: reserva.clienteId,
        mensaje: `Tu pago de $${reserva.total.toLocaleString("es-MX")} fue registrado correctamente.`,
        tipo: "pago_registrado",
        leida: false,
        fecha: hoy(),
      }
      dispatch({
        type: "pagarReservacion",
        payload: { id, pago, notificacion },
      })
      return { ok: true, id: pago.id }
    },
    [db.reservaciones],
  )

  const solicitarIntencion: Store["solicitarIntencion"] = useCallback(
    (id) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      const espacio = reserva
        ? db.espacios.find((e) => e.id === reserva.espacioId)
        : undefined
      if (!reserva || !espacio) {
        return { ok: false, error: "Reservación no encontrada." }
      }
      if (espacio.propietarioId !== usuarioActual?.id) {
        return { ok: false, error: "No puedes modificar esta reservación." }
      }
      if (reserva.mensaje?.trim()) {
        return { ok: false, error: "El cliente ya agregó la intención del evento." }
      }
      if (reserva.intencionSolicitada) {
        return { ok: false, error: "Ya solicitaste la intención del evento." }
      }
      const notificacion: Notificacion = {
        id: uid("n"),
        usuarioId: reserva.clienteId,
        mensaje: `El propietario de ${espacio.nombre} te pidió agregar la intención de tu evento.`,
        tipo: "intencion_solicitada",
        leida: false,
        fecha: hoy(),
      }
      dispatch({ type: "solicitarIntencion", payload: { id, notificacion } })
      return { ok: true }
    },
    [db.espacios, db.reservaciones, usuarioActual?.id],
  )

  const enviarIntencion: Store["enviarIntencion"] = useCallback(
    (id, mensaje) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      if (!reserva) {
        return { ok: false, error: "Reservación no encontrada." }
      }
      if (reserva.clienteId !== usuarioActual?.id) {
        return { ok: false, error: "No puedes editar esta reservación." }
      }
      if (!reserva.intencionSolicitada) {
        return { ok: false, error: "El propietario no ha solicitado este mensaje." }
      }
      if (reserva.mensaje?.trim()) {
        return { ok: false, error: "La intención del evento ya fue agregada." }
      }
      const intencion = mensaje.trim()
      if (intencion.length < 10 || intencion.length > 500) {
        return {
          ok: false,
          error: "La intención debe tener entre 10 y 500 caracteres.",
        }
      }
      dispatch({ type: "enviarIntencion", payload: { id, mensaje: intencion } })
      return { ok: true }
    },
    [db.reservaciones, usuarioActual?.id],
  )

  const solicitarComentario: Store["solicitarComentario"] = useCallback(
    (id) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      const espacio = reserva
        ? db.espacios.find((e) => e.id === reserva.espacioId)
        : undefined
      if (!reserva || !espacio) {
        return { ok: false, error: "Reservación no encontrada." }
      }
      if (espacio.propietarioId !== usuarioActual?.id) {
        return { ok: false, error: "No puedes modificar esta reservación." }
      }
      if (reserva.estado !== "aprobada") {
        return {
          ok: false,
          error: "Solo puedes solicitar comentarios en reservaciones aprobadas.",
        }
      }
      if (reserva.comentarioSolicitado) {
        return {
          ok: false,
          error: "Ya solicitaste un comentario para esta reservación.",
        }
      }
      const notificacion: Notificacion = {
        id: uid("n"),
        usuarioId: reserva.clienteId,
        mensaje: `El propietario de ${espacio.nombre} te solicitó un comentario sobre tu experiencia.`,
        tipo: "comentario_solicitado",
        leida: false,
        fecha: hoy(),
      }
      dispatch({ type: "solicitarComentario", payload: { id, notificacion } })
      return { ok: true }
    },
    [db.espacios, db.reservaciones, usuarioActual?.id],
  )

  const enviarComentario: Store["enviarComentario"] = useCallback(
    (id, comentario) => {
      const reserva = db.reservaciones.find((r) => r.id === id)
      if (!reserva) {
        return { ok: false, error: "Reservación no encontrada." }
      }
      if (reserva.clienteId !== usuarioActual?.id) {
        return { ok: false, error: "No puedes comentar esta reservación." }
      }
      if (!reserva.comentarioSolicitado) {
        return {
          ok: false,
          error: "El propietario aún no ha solicitado un comentario.",
        }
      }
      if (reserva.comentarioCliente) {
        return {
          ok: false,
          error: "Ya enviaste un comentario para esta reservación.",
        }
      }
      const texto = comentario.trim()
      if (texto.length < 10 || texto.length > 500) {
        return {
          ok: false,
          error: "El comentario debe tener entre 10 y 500 caracteres.",
        }
      }
      dispatch({ type: "enviarComentario", payload: { id, comentario: texto } })
      return { ok: true }
    },
    [db.reservaciones, usuarioActual?.id],
  )

  const suspenderUsuario = useCallback((id: string) => {
    dispatch({ type: "suspenderUsuario", payload: { id } })
  }, [])

  const reactivarUsuario = useCallback((id: string) => {
    dispatch({ type: "reactivarUsuario", payload: { id } })
  }, [])

  const resolverVerificacion: Store["resolverVerificacion"] = useCallback(
    (id, estado) => {
      const notificacion: Notificacion = {
        id: uid("n"),
        usuarioId: id,
        mensaje:
          estado === "aprobada"
            ? "Tu identidad fue verificada correctamente."
            : "Tu verificación fue rechazada. Vuelve a intentarlo.",
        tipo: "verificacion",
        leida: false,
        fecha: hoy(),
      }
      dispatch({
        type: "resolverVerificacion",
        payload: { id, estado, notificacion },
      })
    },
    [],
  )

  const marcarLeida = useCallback((id: string) => {
    dispatch({ type: "marcarLeida", payload: { id } })
  }, [])

  const marcarTodasLeidas = useCallback((usuarioId: string) => {
    dispatch({ type: "marcarTodasLeidas", payload: { usuarioId } })
  }, [])

  const value = useMemo<Store>(
    () => ({
      hydrated,
      usuarioActual,
      usuarios: db.usuarios,
      espacios: db.espacios,
      reservaciones: db.reservaciones,
      pagos: db.pagos,
      notificaciones: db.notificaciones,
      registrar,
      iniciarSesion,
      cerrarSesion,
      recuperar,
      actualizarPerfil,
      enviarVerificacion,
      publicarEspacio,
      actualizarEspacio,
      alternarEstadoEspacio,
      bloquearFechas,
      eliminarBloqueo,
      solicitarReservacion,
      aprobarReservacion,
      rechazarReservacion,
      cancelarReservacion,
      pagarReservacion,
      solicitarIntencion,
      enviarIntencion,
      solicitarComentario,
      enviarComentario,
      suspenderUsuario,
      reactivarUsuario,
      resolverVerificacion,
      marcarLeida,
      marcarTodasLeidas,
      espacioDisponible,
    }),
    [
      hydrated,
      usuarioActual,
      db.usuarios,
      db.espacios,
      db.reservaciones,
      db.pagos,
      db.notificaciones,
      registrar,
      iniciarSesion,
      cerrarSesion,
      recuperar,
      actualizarPerfil,
      enviarVerificacion,
      publicarEspacio,
      actualizarEspacio,
      alternarEstadoEspacio,
      bloquearFechas,
      eliminarBloqueo,
      solicitarReservacion,
      aprobarReservacion,
      rechazarReservacion,
      cancelarReservacion,
      pagarReservacion,
      solicitarIntencion,
      enviarIntencion,
      solicitarComentario,
      enviarComentario,
      suspenderUsuario,
      reactivarUsuario,
      resolverVerificacion,
      marcarLeida,
      marcarTodasLeidas,
      espacioDisponible,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider")
  return ctx
}

export function useRol(rol?: Rol) {
  const { usuarioActual } = useStore()
  if (!rol) return usuarioActual
  return usuarioActual?.rol === rol ? usuarioActual : null
}

