"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type Resultado = { ok: boolean; error?: string; id?: string }

interface Store {
  hydrated: boolean
  usuarioActual: Usuario | null
  usuarios: Usuario[]
  espacios: Espacio[]
  reservaciones: Reservacion[]
  pagos: Pago[]
  notificaciones: Notificacion[]
  // auth
  registrar: (data: Omit<Usuario, "id" | "estado" | "verificacion">) => Resultado
  iniciarSesion: (correo: string, password: string) => Resultado
  cerrarSesion: () => void
  recuperar: (correo: string) => Resultado
  actualizarPerfil: (data: Pick<Usuario, "nombre" | "telefono">) => void
  enviarVerificacion: (documento: string) => void
  // espacios
  publicarEspacio: (
    data: Omit<Espacio, "id" | "propietarioId" | "estado" | "bloqueos" | "creado">,
  ) => Resultado
  actualizarEspacio: (id: string, data: Partial<Espacio>) => void
  alternarEstadoEspacio: (id: string) => void
  bloquearFechas: (espacioId: string, inicio: string, fin: string) => Resultado
  eliminarBloqueo: (espacioId: string, bloqueoId: string) => void
  // reservaciones
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
  // admin
  suspenderUsuario: (id: string) => void
  reactivarUsuario: (id: string) => void
  resolverVerificacion: (id: string, estado: EstadoVerificacion) => void
  // notificaciones
  marcarLeida: (id: string) => void
  marcarTodasLeidas: (usuarioId: string) => void
  // helpers
  espacioDisponible: (
    espacioId: string,
    inicio: string,
    fin: string,
    ignorarReservacionId?: string,
  ) => boolean
}

const StoreContext = createContext<Store | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
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
  const [db, setDb] = useState<DBShape>(seed)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setDb(JSON.parse(raw))
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // ignore
    }
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
      if (!espacio) return false
      if (inicio > fin) return false
      for (const b of espacio.bloqueos) {
        if (traslapa(inicio, fin, b.inicio, b.fin)) return false
      }
      const aprobadas = db.reservaciones.filter(
        (r) =>
          r.espacioId === espacioId &&
          r.estado === "aprobada" &&
          r.id !== ignorarReservacionId,
      )
      for (const r of aprobadas) {
        if (traslapa(inicio, fin, r.inicio, r.fin)) return false
      }
      return true
    },
    [db.espacios, db.reservaciones],
  )

  const registrar: Store["registrar"] = useCallback((data) => {
    let result: Resultado = { ok: true }
    setDb((prev) => {
      const existe = prev.usuarios.some(
        (u) => u.correo.toLowerCase() === data.correo.toLowerCase(),
      )
      if (existe) {
        result = { ok: false, error: "Ya existe una cuenta con este correo." }
        return prev
      }
      const nuevo: Usuario = {
        ...data,
        id: uid("u"),
        estado: "activo",
        verificacion: "no_enviada",
      }
      result = { ok: true, id: nuevo.id }
      return {
        ...prev,
        usuarios: [...prev.usuarios, nuevo],
        sesionId: nuevo.id,
      }
    })
    return result
  }, [])

  const iniciarSesion: Store["iniciarSesion"] = useCallback(
    (correo, password) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        const u = prev.usuarios.find(
          (x) => x.correo.toLowerCase() === correo.toLowerCase(),
        )
        if (!u || u.password !== password) {
          result = { ok: false, error: "Correo o contraseña incorrectos." }
          return prev
        }
        if (u.estado === "suspendido") {
          result = { ok: false, error: "Tu cuenta está suspendida." }
          return prev
        }
        result = { ok: true, id: u.id }
        return { ...prev, sesionId: u.id }
      })
      return result
    },
    [],
  )

  const cerrarSesion = useCallback(() => {
    setDb((prev) => ({ ...prev, sesionId: null }))
  }, [])

  const recuperar: Store["recuperar"] = useCallback((correo) => {
    const existe = db.usuarios.some(
      (u) => u.correo.toLowerCase() === correo.toLowerCase(),
    )
    if (!existe) {
      return { ok: false, error: "No encontramos una cuenta con ese correo." }
    }
    return { ok: true }
  }, [db.usuarios])

  const actualizarPerfil: Store["actualizarPerfil"] = useCallback((data) => {
    setDb((prev) => {
      if (!prev.sesionId) return prev
      return {
        ...prev,
        usuarios: prev.usuarios.map((u) =>
          u.id === prev.sesionId ? { ...u, ...data } : u,
        ),
      }
    })
  }, [])

  const enviarVerificacion: Store["enviarVerificacion"] = useCallback(
    (documento) => {
      setDb((prev) => {
        if (!prev.sesionId) return prev
        return {
          ...prev,
          usuarios: prev.usuarios.map((u) =>
            u.id === prev.sesionId
              ? { ...u, verificacion: "pendiente" as EstadoVerificacion, documento }
              : u,
          ),
        }
      })
    },
    [],
  )

  const publicarEspacio: Store["publicarEspacio"] = useCallback((data) => {
    let result: Resultado = { ok: true }
    setDb((prev) => {
      if (!prev.sesionId) {
        result = { ok: false, error: "Sesión no válida." }
        return prev
      }
      const nuevo: Espacio = {
        ...data,
        id: uid("e"),
        propietarioId: prev.sesionId,
        estado: "activo",
        bloqueos: [],
        creado: hoy(),
      }
      result = { ok: true, id: nuevo.id }
      return { ...prev, espacios: [...prev.espacios, nuevo] }
    })
    return result
  }, [])

  const actualizarEspacio: Store["actualizarEspacio"] = useCallback(
    (id, data) => {
      setDb((prev) => ({
        ...prev,
        espacios: prev.espacios.map((e) =>
          e.id === id ? { ...e, ...data } : e,
        ),
      }))
    },
    [],
  )

  const alternarEstadoEspacio: Store["alternarEstadoEspacio"] = useCallback(
    (id) => {
      setDb((prev) => ({
        ...prev,
        espacios: prev.espacios.map((e) =>
          e.id === id
            ? { ...e, estado: e.estado === "activo" ? "inactivo" : "activo" }
            : e,
        ),
      }))
    },
    [],
  )

  const bloquearFechas: Store["bloquearFechas"] = useCallback(
    (espacioId, inicio, fin) => {
      if (!inicio || !fin) return { ok: false, error: "Selecciona ambas fechas." }
      if (inicio > fin)
        return { ok: false, error: "La fecha de inicio no puede ser posterior a la fecha fin." }
      setDb((prev) => ({
        ...prev,
        espacios: prev.espacios.map((e) =>
          e.id === espacioId
            ? {
                ...e,
                bloqueos: [...e.bloqueos, { id: uid("b"), inicio, fin }],
              }
            : e,
        ),
      }))
      return { ok: true }
    },
    [],
  )

  const eliminarBloqueo: Store["eliminarBloqueo"] = useCallback(
    (espacioId, bloqueoId) => {
      setDb((prev) => ({
        ...prev,
        espacios: prev.espacios.map((e) =>
          e.id === espacioId
            ? { ...e, bloqueos: e.bloqueos.filter((b) => b.id !== bloqueoId) }
            : e,
        ),
      }))
    },
    [],
  )

  const solicitarReservacion: Store["solicitarReservacion"] = useCallback(
    (espacioId, inicio, fin, mensaje) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        if (!prev.sesionId) {
          result = { ok: false, error: "Inicia sesión para reservar." }
          return prev
        }
        const espacio = prev.espacios.find((e) => e.id === espacioId)
        if (!espacio) {
          result = { ok: false, error: "Espacio no encontrado." }
          return prev
        }
        if (!inicio || !fin) {
          result = { ok: false, error: "Selecciona las fechas de la reservación." }
          return prev
        }
        if (inicio > fin) {
          result = { ok: false, error: "La fecha de inicio no puede ser posterior a la fecha fin." }
          return prev
        }
        const intencion = mensaje.trim()
        if (intencion.length < 10) {
          result = {
            ok: false,
            error: "Describe la intención del evento con al menos 10 caracteres.",
          }
          return prev
        }
        if (intencion.length > 500) {
          result = {
            ok: false,
            error: "El mensaje no puede superar los 500 caracteres.",
          }
          return prev
        }
        // disponibilidad
        for (const b of espacio.bloqueos) {
          if (traslapa(inicio, fin, b.inicio, b.fin)) {
            result = { ok: false, error: "No disponible para las fechas seleccionadas." }
            return prev
          }
        }
        const conflicto = prev.reservaciones.some(
          (r) =>
            r.espacioId === espacioId &&
            r.estado === "aprobada" &&
            traslapa(inicio, fin, r.inicio, r.fin),
        )
        if (conflicto) {
          result = { ok: false, error: "No disponible para las fechas seleccionadas." }
          return prev
        }
        const dias = diasEntre(inicio, fin)
        const nueva: Reservacion = {
          id: uid("r"),
          espacioId,
          clienteId: prev.sesionId,
          inicio,
          fin,
          dias,
          total: dias * espacio.precio,
          mensaje: intencion,
          estado: "pendiente",
          creado: hoy(),
        }
        const noti: Notificacion = {
          id: uid("n"),
          usuarioId: espacio.propietarioId,
          mensaje: `Recibiste una nueva solicitud para ${espacio.nombre}.`,
          tipo: "nueva_solicitud",
          leida: false,
          fecha: hoy(),
        }
        result = { ok: true, id: nueva.id }
        return {
          ...prev,
          reservaciones: [...prev.reservaciones, nueva],
          notificaciones: [noti, ...prev.notificaciones],
        }
      })
      return result
    },
    [],
  )

  const cambiarEstadoReservacion = useCallback(
    (id: string, estado: Reservacion["estado"]) => {
      setDb((prev) => {
        const reserva = prev.reservaciones.find((r) => r.id === id)
        if (!reserva) return prev
        const espacio = prev.espacios.find((e) => e.id === reserva.espacioId)
        const notis: Notificacion[] = []
        if (estado === "aprobada") {
          notis.push({
            id: uid("n"),
            usuarioId: reserva.clienteId,
            mensaje: `Tu reservación de ${espacio?.nombre ?? "espacio"} fue aprobada.`,
            tipo: "reservacion_aprobada",
            leida: false,
            fecha: hoy(),
          })
        } else if (estado === "rechazada") {
          notis.push({
            id: uid("n"),
            usuarioId: reserva.clienteId,
            mensaje: `Tu reservación de ${espacio?.nombre ?? "espacio"} fue rechazada.`,
            tipo: "reservacion_rechazada",
            leida: false,
            fecha: hoy(),
          })
        } else if (estado === "cancelada" && espacio) {
          notis.push({
            id: uid("n"),
            usuarioId: espacio.propietarioId,
            mensaje: `El cliente canceló una reservación de ${espacio.nombre}.`,
            tipo: "reservacion_cancelada",
            leida: false,
            fecha: hoy(),
          })
        }
        return {
          ...prev,
          reservaciones: prev.reservaciones.map((r) =>
            r.id === id ? { ...r, estado } : r,
          ),
          notificaciones: [...notis, ...prev.notificaciones],
        }
      })
    },
    [],
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

  const pagarReservacion: Store["pagarReservacion"] = useCallback((id) => {
    let result: Resultado = { ok: true }
    setDb((prev) => {
      const reserva = prev.reservaciones.find((r) => r.id === id)
      if (!reserva) {
        result = { ok: false, error: "Reservación no encontrada." }
        return prev
      }
      if (reserva.estado !== "aprobada") {
        result = { ok: false, error: "Solo puedes pagar reservaciones aprobadas." }
        return prev
      }
      if (reserva.pagoId) {
        result = { ok: false, error: "Esta reservación ya fue pagada." }
        return prev
      }
      const pago: Pago = {
        id: uid("p"),
        reservacionId: reserva.id,
        monto: reserva.total,
        estado: "pagado",
        fecha: hoy(),
      }
      const noti: Notificacion = {
        id: uid("n"),
        usuarioId: reserva.clienteId,
        mensaje: `Tu pago de $${reserva.total.toLocaleString("es-MX")} fue registrado correctamente.`,
        tipo: "pago_registrado",
        leida: false,
        fecha: hoy(),
      }
      result = { ok: true, id: pago.id }
      return {
        ...prev,
        pagos: [...prev.pagos, pago],
        reservaciones: prev.reservaciones.map((r) =>
          r.id === id ? { ...r, pagoId: pago.id } : r,
        ),
        notificaciones: [noti, ...prev.notificaciones],
      }
    })
    return result
  }, [])

  const solicitarIntencion: Store["solicitarIntencion"] = useCallback(
    (id) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        const reserva = prev.reservaciones.find((r) => r.id === id)
        const espacio = reserva
          ? prev.espacios.find((e) => e.id === reserva.espacioId)
          : undefined
        if (!reserva || !espacio) {
          result = { ok: false, error: "Reservación no encontrada." }
          return prev
        }
        if (espacio.propietarioId !== usuarioActual?.id) {
          result = { ok: false, error: "No puedes modificar esta reservación." }
          return prev
        }
        if (reserva.mensaje?.trim()) {
          result = { ok: false, error: "El cliente ya agregó la intención del evento." }
          return prev
        }
        if (reserva.intencionSolicitada) {
          result = { ok: false, error: "Ya solicitaste la intención del evento." }
          return prev
        }
        const notificacion: Notificacion = {
          id: uid("n"),
          usuarioId: reserva.clienteId,
          mensaje: `El propietario de ${espacio.nombre} te pidió agregar la intención de tu evento.`,
          tipo: "intencion_solicitada",
          leida: false,
          fecha: hoy(),
        }
        return {
          ...prev,
          reservaciones: prev.reservaciones.map((r) =>
            r.id === id ? { ...r, intencionSolicitada: true } : r,
          ),
          notificaciones: [notificacion, ...prev.notificaciones],
        }
      })
      return result
    },
    [usuarioActual],
  )

  const enviarIntencion: Store["enviarIntencion"] = useCallback(
    (id, mensaje) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        const reserva = prev.reservaciones.find((r) => r.id === id)
        if (!reserva) {
          result = { ok: false, error: "Reservación no encontrada." }
          return prev
        }
        if (reserva.clienteId !== usuarioActual?.id) {
          result = { ok: false, error: "No puedes editar esta reservación." }
          return prev
        }
        if (!reserva.intencionSolicitada) {
          result = { ok: false, error: "El propietario no ha solicitado este mensaje." }
          return prev
        }
        if (reserva.mensaje?.trim()) {
          result = { ok: false, error: "La intención del evento ya fue agregada." }
          return prev
        }
        const intencion = mensaje.trim()
        if (intencion.length < 10 || intencion.length > 500) {
          result = {
            ok: false,
            error: "La intención debe tener entre 10 y 500 caracteres.",
          }
          return prev
        }
        return {
          ...prev,
          reservaciones: prev.reservaciones.map((r) =>
            r.id === id ? { ...r, mensaje: intencion } : r,
          ),
        }
      })
      return result
    },
    [usuarioActual],
  )

  const solicitarComentario: Store["solicitarComentario"] = useCallback(
    (id) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        const reserva = prev.reservaciones.find((r) => r.id === id)
        const espacio = reserva
          ? prev.espacios.find((e) => e.id === reserva.espacioId)
          : undefined
        if (!reserva || !espacio) {
          result = { ok: false, error: "Reservación no encontrada." }
          return prev
        }
        if (espacio.propietarioId !== usuarioActual?.id) {
          result = { ok: false, error: "No puedes modificar esta reservación." }
          return prev
        }
        if (reserva.estado !== "aprobada") {
          result = { ok: false, error: "Solo puedes solicitar comentarios en reservaciones aprobadas." }
          return prev
        }
        if (reserva.comentarioSolicitado) {
          result = { ok: false, error: "Ya solicitaste un comentario para esta reservación." }
          return prev
        }
        const noti: Notificacion = {
          id: uid("n"),
          usuarioId: reserva.clienteId,
          mensaje: `El propietario de ${espacio.nombre} te solicitó un comentario sobre tu experiencia.`,
          tipo: "comentario_solicitado",
          leida: false,
          fecha: hoy(),
        }
        return {
          ...prev,
          reservaciones: prev.reservaciones.map((r) =>
            r.id === id ? { ...r, comentarioSolicitado: true } : r,
          ),
          notificaciones: [noti, ...prev.notificaciones],
        }
      })
      return result
    },
    [usuarioActual],
  )

  const enviarComentario: Store["enviarComentario"] = useCallback(
    (id, comentario) => {
      let result: Resultado = { ok: true }
      setDb((prev) => {
        const reserva = prev.reservaciones.find((r) => r.id === id)
        if (!reserva) {
          result = { ok: false, error: "Reservación no encontrada." }
          return prev
        }
        if (reserva.clienteId !== usuarioActual?.id) {
          result = { ok: false, error: "No puedes comentar esta reservación." }
          return prev
        }
        if (!reserva.comentarioSolicitado) {
          result = { ok: false, error: "El propietario aún no ha solicitado un comentario." }
          return prev
        }
        if (reserva.comentarioCliente) {
          result = { ok: false, error: "Ya enviaste un comentario para esta reservación." }
          return prev
        }
        const texto = comentario.trim()
        if (texto.length < 10 || texto.length > 500) {
          result = { ok: false, error: "El comentario debe tener entre 10 y 500 caracteres." }
          return prev
        }
        return {
          ...prev,
          reservaciones: prev.reservaciones.map((r) =>
            r.id === id ? { ...r, comentarioCliente: texto } : r,
          ),
        }
      })
      return result
    },
    [usuarioActual],
  )

  const suspenderUsuario = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) =>
        u.id === id ? { ...u, estado: "suspendido" } : u,
      ),
    }))
  }, [])

  const reactivarUsuario = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) =>
        u.id === id ? { ...u, estado: "activo" } : u,
      ),
    }))
  }, [])

  const resolverVerificacion: Store["resolverVerificacion"] = useCallback(
    (id, estado) => {
      setDb((prev) => {
        const noti: Notificacion = {
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
        return {
          ...prev,
          usuarios: prev.usuarios.map((u) =>
            u.id === id ? { ...u, verificacion: estado } : u,
          ),
          notificaciones: [noti, ...prev.notificaciones],
        }
      })
    },
    [],
  )

  const marcarLeida = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      notificaciones: prev.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n,
      ),
    }))
  }, [])

  const marcarTodasLeidas = useCallback((usuarioId: string) => {
    setDb((prev) => ({
      ...prev,
      notificaciones: prev.notificaciones.map((n) =>
        n.usuarioId === usuarioId ? { ...n, leida: true } : n,
      ),
    }))
  }, [])

  const value: Store = {
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
  }

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
