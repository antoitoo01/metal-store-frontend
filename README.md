# MetalStore Frontend

> Aplicación de gestión empresarial para metalistería — control de stock, presupuestos, facturación y catálogo técnico de perfiles metálicos.

## Stack

| Tecnología | Versión |
|-----------|---------|
| Angular | 22 (standalone, zoneless, Signals) |
| TypeScript | 6.0 |
| Tailwind CSS | 4.3 |
| TanStack Query | Angular 5.101 |
| Bun | 1.3 |
| Vitest | 4.0 |

## Arquitectura

```
src/
├── app/
│   ├── core/           # Servicios, guards, interceptors, modelos
│   ├── features/       # Módulos de negocio (auth, clients, catalog, ...)
│   ├── layout/         # Shell de la app (sidebar, topbar, breadcrumb)
│   └── shared/         # Componentes reutilizables
├── environments/       # Config por entorno
└── styles.css          # Tailwind entrypoint
```

### Módulos funcionales

| Módulo | Descripción |
|--------|-------------|
| Auth | Login/registro, JWT, multi-tenancy |
| Clients | CRUD de clientes con activación/desactivación |
| Catalog | Perfiles estructurales, familias, ítems, tipos, imágenes |
| Inventory | Control de stock con trazabilidad |
| Quotes | Presupuestos con máquina de estados (DRAFT → ISSUED → ACCEPTED/REJECTED) |
| Billing | Facturación y precios con gestión de estados |
| Users | Administración de usuarios del tenant |

## Requisitos

- [Bun](https://bun.sh) 1.3+
- Backend corriendo en `http://localhost:8080`

## Desarrollo

```bash
# Instalar dependencias
bun install

# Iniciar servidor de desarrollo (http://localhost:4200)
bun start

# Ejecutar tests
bun test

# Linter
bun run lint
```

## Backend

El frontend se conecta al backend [`metal-store`](https://github.com/anomalyco/metal-store) (Spring Boot 4, Kotlin, PostgreSQL/H2).

Endpoints principales en `http://localhost:8080`:
- API REST: `/api/*`
- Documentación Swagger: `/swagger-ui/index.html`

> El perfil `dev` del backend usa H2 en memoria y `permitAll` para seguridad — ideal para desarrollo local sin necesidad de JWT.

## Variables de entorno

| Variable | Descripción | Defecto |
|----------|-------------|---------|
| `API_URL` | URL base del backend | `/api` |

## Build

```bash
bun run build        # Producción en dist/
bun run watch        # Dev con watch
```

## Licencia

Uso interno.
