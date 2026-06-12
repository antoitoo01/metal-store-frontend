## Reglas de interacción

- **Blunt correction rule**: Cuando yo proponga o sugiera una solución, decime AL INSTANTE si es mala práctica, anti-patrón, ineficiente, sobreingeniería o simplemente estúpida. No lo suavices. No esperes. No pidas permiso. Quiero escucharlo AHORA, no después.

# Metal Store Frontend — Backend API Reference

## Stack del frontend

- **Angular 22** (lanzado Junio 2026) — Signal Forms estable, Selectorless components, OnPush default, Zoneless por defecto
- **Tailwind CSS** — estilos utilitarios
- **@tanstack/angular-query-experimental** — data fetching con caché, refetch automático, mutations
- **Zoneless** — sin Zone.js, todo con Signals (mejor rendimiento, debugging más limpio)
- **Reactive Forms + Zod** o **Signal Forms nativos** — formularios tipados

## Stack del backend

- Java 25, Kotlin 2.2.21, Spring Boot 4.0.1
- Spring Security + OAuth2 Resource Server (JWT via Supabase Auth)
- JPA/Hibernate 7 + PostgreSQL (prod) / H2 (dev/test)
- Multi-tenancy por tenantId
- OpenAPI 3.0 (Springdoc) en `/swagger-ui/index.html`

## Cómo correr el backend local

```bash
cd metal-store
./gradlew bootRun  # perfil "dev" por defecto → H2 + permit-all security
```

Variables de entorno (`.env`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`

El backend corre en `http://localhost:8080` con CORS abierto (`*`) en dev.

## Autenticación

### Perfiles de seguridad

| Profile | Backend DB | Security |
|---------|-----------|----------|
| `dev` (default) | H2 en memoria | `permitAll` — no necesita JWT |
| `test` | H2 en memoria | `permitAll` |
| `prod` | PostgreSQL | OAuth2 JWT — requiere token Supabase |

### Endpoints de auth

```
POST /api/auth/register   → 201 LoginResponse
POST /api/auth/login      → 200 LoginResponse
GET  /api/auth/me         → 200 UserResponse
POST /api/auth/refresh    → 200 LoginResponse
POST /api/auth/logout     → 204
GET  /api/health          → 200 { status, timestamp }
```

### RegisterRequest
```typescript
{ username?: string, tenantName?: string, email: string, password: string }
// Password: min 8 chars, must have upper, lower, number, special char
```

### LoginRequest
```typescript
{ email: string, password: string }
```

### LoginResponse
```typescript
{
  accessToken: string     // JWT
  tokenType: "Bearer"
  refreshToken?: string
  expiresIn: 3600
  email: string
  role: "ADMIN" | "USER"
  tenantId: string        // UUID
  tenantName: string
}
```

### En prod — enviar JWT en cada request
```
Authorization: Bearer <accessToken>
```

## Multi-tenancy

Todas las entidades tienen `tenantId`. En **dev** se pasa por header:
```
X-Tenant-Id: <UUID>
```
Sin ese header, los endpoints que usan `@CurrentTenantId` devuelven 400.

En **prod** el tenant se extrae del JWT automáticamente.

## Paginación

Todos los endpoints de listado aceptan parámetros Spring `Pageable`:
```
?page=0&size=20&sort=name,asc
```
Devuelven `Page<T>` de Spring:
```typescript
{
  content: T[],
  totalElements: number,
  totalPages: number,
  size: number,
  number: number,         // página actual (0-indexed)
  first: boolean,
  last: boolean,
  empty: boolean
}
```

---

## 1. Clientes — `/api/clients`

### Endpoints

```
GET    /api/clients                      → Page<ClientResponse>
GET    /api/clients/:id                  → 200 ClientResponse | 404
POST   /api/clients                      → 201 ClientResponse
PUT    /api/clients/:id                  → 200 ClientResponse | 404
DELETE /api/clients/:id                  → 204 | 404
POST   /api/clients/:id/activate         → 200 ClientResponse | 404
POST   /api/clients/:id/deactivate       → 200 ClientResponse | 404
```

### Query params (GET list)
- `q` — filtro por nombre (case-insensitive, partial match)
- `page`, `size`, `sort`

### CreateClientRequest
```typescript
{
  name: string,           // required
  email?: string,
  phone?: string,
  address?: string,
  vatNumber?: string,     // CIF/NIF
  notes?: string
}
```

### ClientResponse
```typescript
{
  id: string,
  tenantId: string,
  name: string,
  email: string | null,
  phone: string | null,
  address: string | null,
  vatNumber: string | null,
  notes: string | null,
  status: "ACTIVE" | "INACTIVE",
  createdAt: string,      // ISO datetime
  updatedAt: string
}
```

---

## 2. Catálogo — Perfiles — `/api/catalog/profiles`

### Endpoints

```
GET  /api/catalog/profiles          → Page<CatalogProfile>
GET  /api/catalog/profiles/:id      → 200 CatalogProfile | 404
```

### Query params (GET list)
- `q` — búsqueda textual
- `standard` — filtro por norma (ej: `EUR`, `AISC`)
- `shapeType` — filtro por tipo de perfil
- `familyCode` — filtro por código de familia
- `page`, `size`, `sort`

### CatalogProfile (heredan AiscProfile, EuroProfile)
```typescript
{
  id: string,
  family: CatalogFamily,
  designation: string,       // "IPE 200" etc
  weightKgM: number | null,
  areaCm2: number | null,
  imagePath: string | null,
  createdAt: string,
  updatedAt: string
  // + campos específicos según standard (h, b, tw, tf, r, etc.)
}
```

---

## 3. Catálogo — Familias — `/api/catalog/families`

```
GET /api/catalog/families?standard=EUR → CatalogFamily[]
```

### CatalogFamily
```typescript
{
  id: string,
  code: string,        // ej: "IPN", "HEA", "UPN"
  name: string,        // ej: "I-Profile (IPN)"
  standard: string,    // "EUR" | "AISC"
  shapeType: string    // "I", "C", "L", "U", "T", "CHS", etc
}
```

---

## 4. Catálogo — Ítems — `/api/catalog/items`

```
GET  /api/catalog/items          → Page<CatalogItem>
GET  /api/catalog/items/:id      → 200 CatalogItem | 404
```

### Query params
- `q` — búsqueda textual
- `itemType` — filtro por tipo
- `page`, `size`, `sort`

### CatalogItem
```typescript
{
  id: string,
  typeId: string | null,
  itemType: string,
  sku: string | null,
  designation: string,
  dimensions: string | null,
  weightKgM: number | null,
  material: string | null,
  estimatedPriceKg: number,
  metadata: string | null,   // JSON string
  imagePath: string | null,
  createdAt: string,
  updatedAt: string
}
```

---

## 5. Catálogo — Tipos de Ítem — `/api/catalog/item-types`

```
GET    /api/catalog/item-types       → Page<TypeResponse>
GET    /api/catalog/item-types/:id   → 200 TypeResponse | 404
POST   /api/catalog/item-types       → 201 TypeResponse
PUT    /api/catalog/item-types/:id   → 200 TypeResponse | 404
DELETE /api/catalog/item-types/:id   → 204 | 404
```

### CreateTypeRequest
```typescript
{ name: string }
```

### TypeResponse
```typescript
{ id: string, tenantId: string, name: string }
```

---

## 6. Catálogo — Imágenes — `/api/catalog/.../image` y `/api/images/...`

### Subir imagen de perfil
```
POST /api/catalog/profiles/:id/image  (multipart/form-data)
→ 201 { "imageUrl": "http://localhost:8080/api/images/profiles/foto.jpg" }
```

### Subir imagen de ítem
```
POST /api/catalog/items/:id/image  (multipart/form-data)
→ 201 { "imageUrl": "http://localhost:8080/api/images/items/foto.jpg" }
```

### Eliminar imagen
```
DELETE /api/catalog/profiles/:id/image → 204
DELETE /api/catalog/items/:id/image   → 204
```

### Servir imagen
```
GET /api/images/{namespace}/{filename}
→ 200 image/jpeg | image/png | image/webp | 404
```

**Nota**: En dev las imágenes se guardan en `uploads/items/` y `uploads/profiles/`. En prod usa Supabase Storage.

---

## 7. Inventario — `/api/inventory`

```
GET    /api/inventory           → Page<ItemResponse>
GET    /api/inventory/:id       → 200 ItemResponse | 404
POST   /api/inventory           → 201 ItemResponse
PUT    /api/inventory/:id       → 200 ItemResponse | 404
DELETE /api/inventory/:id       → 204 | 404
```

### CreateItemRequest
```typescript
{
  profileId?: string,     // UUID — exclusivo con itemId
  itemId?: string,        // UUID — exclusivo con profileId
  quantity: number,       // required, positive
  location?: string,
  costPriceEur?: number,
  supplier?: string,
  notes?: string
}
```

### ItemResponse
```typescript
{
  id: string,
  tenantId: string,
  profileId: string | null,
  itemId: string | null,
  quantity: number,
  location: string | null,
  costPriceEur: number | null,
  supplier: string | null,
  receivedAt: string,     // ISO datetime
  notes: string | null
}
```

---

## 8. Presupuestos — `/api/quotes`

### Endpoints

```
GET    /api/quotes                         → Page<QuoteResponse>
GET    /api/quotes/:id                     → 200 QuoteResponse | 404
POST   /api/quotes                         → 201 QuoteResponse
GET    /api/quotes/:id/lines               → QuoteLineResponse[]
POST   /api/quotes/:id/lines               → 200 QuoteLineResponse | 400
DELETE /api/quotes/:quoteId/lines/:lineId  → 204 | 404
POST   /api/quotes/:id/issue               → 200 QuoteResponse | 400
POST   /api/quotes/:id/accept              → 200 QuoteResponse | 400
POST   /api/quotes/:id/reject              → 200 QuoteResponse | 400
POST   /api/quotes/:id/cancel              → 200 QuoteResponse | 400
```

### Estados de Quote (máquina de estados)

```
DRAFT → ISSUED → ACCEPTED
               → REJECTED
DRAFT → CANCELLED
ISSUED → CANCELLED
```

### CreateQuoteRequest
```typescript
{
  clientId?: string,
  customerName?: string,
  customerVat?: string,
  customerAddress?: string,
  validUntil?: string,       // "2026-07-15"
  notes?: string
}
```

### CreateQuoteLineRequest
```typescript
{
  lineNumber: number,
  profileId?: string,
  itemId?: string,
  description: string,
  quantity: number,       // positive
  unitPrice: number,      // positive
  vatRate: number         // default 21.00
}
```

### QuoteResponse
```typescript
{
  id: string,
  tenantId: string,
  quoteNumber: string,   // "PRES-2026-XXXXXXXX-1"
  clientId: string | null,
  customerName: string | null,
  customerVat: string | null,
  customerAddress: string | null,
  issueDate: string,      // "2026-05-15"
  validUntil: string | null,
  status: "DRAFT" | "ISSUED" | "ACCEPTED" | "REJECTED" | "CANCELLED",
  subtotal: number,
  vatTotal: number,
  total: number,
  notes: string | null
}
```

### QuoteLineResponse
```typescript
{
  id: string,
  quoteId: string,
  lineNumber: number,
  profileId: string | null,
  itemId: string | null,
  description: string,
  quantity: number,
  unitPrice: number,
  vatRate: number,
  totalPrice: number
}
```

---

## 9. Facturación — `/api/billing`

### Endpoints — Precios

```
GET    /api/billing/prices            → Page<PriceResponse>
POST   /api/billing/prices            → 201 PriceResponse
DELETE /api/billing/prices/:id        → 204 | 404
```

### UpsertPriceRequest
```typescript
{
  profileId?: string,
  itemId?: string,
  unitPrice: number,        // positive
  validFrom?: string,       // "2026-01-01"
  validTo?: string,
  notes?: string
}
```

### PriceResponse
```typescript
{
  id: string,
  tenantId: string,
  profileId: string | null,
  itemId: string | null,
  unitPrice: number,
  validFrom: string | null,
  validTo: string | null,
  notes: string | null
}
```

### Endpoints — Facturas

```
GET    /api/billing/invoices                  → Page<InvoiceResponse>
GET    /api/billing/invoices/:id              → 200 InvoiceResponse | 404
POST   /api/billing/invoices?customerName=&customerVat= → 201 InvoiceResponse
GET    /api/billing/invoices/:id/lines        → LineResponse[]
POST   /api/billing/invoices/:id/lines        → 200 LineResponse | 400
DELETE /api/billing/invoices/:invoiceId/lines/:lineId → 204
POST   /api/billing/invoices/:id/issue        → 200 InvoiceResponse | 400
POST   /api/billing/invoices/:id/pay          → 200 InvoiceResponse | 400
POST   /api/billing/invoices/:id/cancel       → 200 InvoiceResponse | 400
```

### Estados de Invoice

```
DRAFT → ISSUED → PAID
ISSUED → CANCELLED
DRAFT → CANCELLED
```

### InvoiceResponse
```typescript
{
  id: string,
  tenantId: string,
  invoiceNumber: string,   // "FAC-2026-XXXXXXXX-1"
  customerName: string | null,
  customerVat: string | null,
  customerAddress: string | null,
  issueDate: string,
  dueDate: string | null,
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED",
  subtotal: number,
  vatTotal: number,
  total: number,
  notes: string | null
}
```

### LineResponse (invoice lines)
```typescript
{
  id: string,
  invoiceId: string,
  lineNumber: number,
  profileId: string | null,
  itemId: string | null,
  description: string,
  quantity: number,
  unitPrice: number,
  vatRate: number,
  totalPrice: number
}
```

### CreateLineRequest
```typescript
{
  lineNumber: number,
  profileId?: string,
  itemId?: string,
  description: string,
  quantity: number,
  unitPrice: number,
  vatRate: number         // default 21.00
}
```

---

## 10. Usuarios — `/api/users`

```
GET    /api/users/:id        → 200 UserResponse | 404
PUT    /api/users            → 200 UserResponse | 401
DELETE /api/users/:id        → 204 | 401 | 404
```

### UserResponse
```typescript
{
  id: string,
  username: string,
  email: string,
  role: "ADMIN" | "USER",
  tenantId: string,
  tenantName: string
}
```

### UpdateUserRequest
```typescript
{ username?: string, email?: string }
```

---

## Tipos compartidos (enums / constantes)

```typescript
type ClientStatus = "ACTIVE" | "INACTIVE"
type QuoteStatus = "DRAFT" | "ISSUED" | "ACCEPTED" | "REJECTED" | "CANCELLED"
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED"
type UserRole = "ADMIN" | "USER"

// Formatos de moneda: BigDecimal → number en JSON (ej: 1250.50)
// Fechas: LocalDate → "2026-05-15", LocalDateTime → "2026-05-15T10:30:00"
// UUIDs → strings "550e8400-e29b-41d4-a716-446655440000"
```

## Manejo de errores API

```typescript
// 400 Bad Request — validación
{ status: 400, error: "Bad Request", message: "Validation failed", errors: [{ field: "email", message: "must be a well-formed email address" }] }

// 404 Not Found
{ status: 404, error: "Not Found", message: "Resource not found", path: "/api/clients/..." }

// 401 Unauthorized (solo prod)
{ status: 401, error: "Unauthorized", message: "Full authentication is required..." }
```

## Stack recomendado para el frontend

- Angular 22 standalone + Signals + Control Flow (Zoneless default)
- Tailwind CSS + shadcn/ui (Headless UI + Tailwind)
- `@tanstack/angular-query-experimental` — data fetching
- Signal Forms (nativos de Angular 22) + Zod para validación cruzada
- `@angular/common/http` — HTTP client con interceptors para JWT y X-Tenant-Id

**Nota Angular 22:** Al ser tan reciente, verificá que `@tanstack/angular-query-experimental` tenga soporte para v22. Si no, Angular 21 estable es igual de funcional (Zoneless, Signals, standalone todo estable).

## Interceptors necesarios

1. **JWT interceptor** — en prod, agrega `Authorization: Bearer <token>` a cada request
2. **Tenant interceptor** — en dev, agrega `X-Tenant-Id` header (guardar tenantId del login)
3. **Error interceptor** — manejar 401 → redirect a login, mostrar toasts en 400/404/500
