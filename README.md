# Sistema de Renta de Espacios

Proyecto final — Administración de proyectos. Plataforma web para publicar, buscar y reservar espacios (salas de juntas, oficinas, salones de eventos, estudios, coworking y terrazas).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- TypeScript
- Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com)
- Gestión de estado con Context API y persistencia en `localStorage` (MVP sin backend)
- Paquetes: lucide-react, recharts, sonner, next-themes

## Roles y cuentas demo

| Rol         | Correo                     | Contraseña |
| ----------- | -------------------------- | ---------- |
| Admin       | `admin@espacios.mx`        | `admin123` |
| Cliente     | `cliente@espacios.mx`      | `cliente123` |
| Propietario | `propietario@espacios.mx`  | `prop123`  |

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando       | Descripción                    |
| ------------- | ------------------------------ |
| `pnpm dev`    | Servidor de desarrollo         |
| `pnpm build`  | Build de producción            |
| `pnpm start`  | Servir el build                |
| `pnpm lint`   | Lint con ESLint                |

## Estructura

- `app/` — páginas y rutas (cliente, propietario, admin, auth)
- `components/` — componentes de UI y de negocio
- `lib/` — tipos, datos mock, store (Context) y utilidades
- `public/` — imágenes y assets

## Notas

- MVP con datos simulados persistidos en `localStorage` (`espacios-mvp-v1`); no hay backend ni base de datos.
- Los pagos son simulados; no se procesan transacciones reales.
