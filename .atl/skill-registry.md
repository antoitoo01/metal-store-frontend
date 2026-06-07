# Skill Registry — metal-store-frontend

Generated: 2026-06-07
Source: `~/.agents/skills/`

---

## Project Conventions (from AGENTS.md)

- **Angular 22** — Zoneless, Signals, Standalone, OnPush default, Control Flow
- **Tailwind CSS** — estilos utilitarios
- **@tanstack/angular-query-experimental** — data fetching con caché, refetch, mutations
- **Signal Forms (nativos)** + Zod para validación cruzada
- **Interceptors necesarios**: JWT, X-Tenant-Id, Error (401 → login)
- **Backend**: Spring Boot 4.0.1, JWT via Supabase Auth, multi-tenancy por tenantId
- **Paginación**: Spring Pageable (`?page=0&size=20&sort=name,asc`)
- **Endpoints**: `/api/clients`, `/api/catalog/*`, `/api/inventory`, `/api/quotes`, `/api/billing/*`, `/api/users`, `/api/auth/*`

---

## Skills

### angular-component
**Location**: `~/.agents/skills/angular-component/SKILL.md`
**Trigger**: Component creation, refactoring class-based inputs to signals, adding host bindings, implementing accessible interactive components.

**Rules**:
1. Create standalone components — do NOT set `standalone: true`.
2. Use `input()` / `input.required()` for all inputs; `output()` for all outputs.
3. Use `host` object in `@Component` — never `@HostBinding` or `@HostListener`.
4. Use native control flow (`@if`, `@for`, `@switch`) — never `*ngIf`, `*ngFor`, `*ngSwitch`.
5. Use `OnPush` change detection; use `computed()` for derived state.
6. Content projection via `<ng-content>` with `select` attribute.
7. Lifecycle: `afterNextRender` / `afterRender` in constructor for DOM work (SSR-safe).
8. Use `NgOptimizedImage` for static images; use `[class.xxx]` / `[style.xxx]` — never `ngClass`/`ngStyle`.
9. Components MUST pass AXE checks, meet WCAG AA, include ARIA attrs, support keyboard nav.

---

### angular-forms
**Location**: `~/.agents/skills/angular-forms/SKILL.md`
**Trigger**: Form implementation, adding validation, creating multi-step forms, building forms with conditional fields.

**Rules**:
1. Use Angular Signal Forms API (experimental in v21): `form()`, `FormField`, `required`, `email`, etc.
2. Form model is a writable signal — single source of truth.
3. Validation schema via callback: `form(model, (path) => { required(path.field) })`.
4. Built-in validators: `required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`.
5. Conditional validation via `when` option; custom via `validate()`.
6. Async validation via `validateHttp()`.
7. Field state signals: `.valid()`, `.invalid()`, `.touched()`, `.dirty()`, `.errors()`, `.pending()`.
8. Dynamic arrays via `applyEach()` on array schema paths.
9. Use `submit(form, async () => {...})` for form submission.
10. `form().reset()` clears interaction state; set model to reset values.

---

### angular-http
**Location**: `~/.agents/skills/angular-http/SKILL.md`
**Trigger**: Data fetching, API integration, loading states, error handling, converting Observable-based HTTP to signal-based patterns.

**Rules**:
1. Prefer `httpResource<T>(() => url)` for signal-based HTTP — wraps HttpClient with state.
2. Resource state: `.value()`, `.hasValue()`, `.error()`, `.isLoading()`, `.status()`.
3. Use `.reload()` for manual retry; pass `undefined` from request fn to skip loading.
4. For non-HTTP async ops, use `resource({ params, loader })`.
5. Functional interceptors (`HttpInterceptorFn`) — register via `withInterceptors()`.
6. Use `catchError` + `retry` with Observable-based HttpClient as fallback.
7. Handle all statuses: `idle`, `loading`, `reloading`, `resolved`, `error`.

---

### angular-routing
**Location**: `~/.agents/skills/angular-routing/SKILL.md`
**Trigger**: Route configuration, adding authentication guards, implementing lazy loading, reading route parameters with signals.

**Rules**:
1. Use `provideRouter(routes, withComponentInputBinding())` — route params become signal inputs.
2. Lazy load via `loadComponent` (single) or `loadChildren` (feature routes).
3. Functional guards: `CanActivateFn`, `CanDeactivateFn` — inject services, return boolean or `UrlTree`.
4. Route data and resolved data accessible via `input.required<T>()` with component input binding.
5. Programmatic navigation via `Router.navigate()` with absolute/relative paths.
6. Use `RouterLink`, `RouterLinkActive`, `RouterOutlet` imports (standalone components).
7. Router events via `Router.events` pipe + `filter`.

---

### angular-signals
**Location**: `~/.agents/skills/angular-signals/SKILL.md`
**Trigger**: State management questions, converting from BehaviorSubject/Observable to signals, implementing reactive data flows.

**Rules**:
1. `signal(value)` — writable; `.set()`, `.update()`, `.asReadonly()`.
2. `computed(fn)` — lazy, memoized derived state; auto-tracks dependencies.
3. `linkedSignal(source, computation)` — dependent state that resets when source changes.
4. `effect(fn)` — side effects in injection context; auto-cleanup on destroy.
5. `toSignal(obs$, options)` / `toObservable(sig)` for RxJS interop.
6. Service pattern: private `_signal`, public `.asReadonly()`, expose `computed` for derived.
7. `untracked(fn)` to read signal without creating dependency.
8. Custom equality via `{ equal: (a, b) => ... }` option.

---

### find-skills
**Location**: `~/.agents/skills/find-skills/SKILL.md`
**Trigger**: User asks "how do I do X", "find a skill for X", "is there a skill that can...", expresses interest in extending agent capabilities.

**Rules**:
1. Identify domain and specific task the user needs.
2. Run `npx skills find <query>` to search the skills ecosystem.
3. Present results with name, description, install command, and skills.sh link.
4. If user wants to install: `npx skills add <owner/repo@skill> -g -y`.
5. If no skill found: offer to help directly, suggest `npx skills init`.

---

### pdf-extraction
**Location**: `~/.agents/skills/pdf-extraction/SKILL.md`
**Trigger**: Extracting text, tables, or metadata from PDFs.

**Rules**:
1. Use `pdfplumber` library for all PDF extraction tasks.
2. `pdfplumber.open(path)` → `pdf.pages[]` → `page.extract_text()` / `page.extract_tables()`.
3. Character-level access: `page.chars[]` with position, font, size.
4. Table detection strategies: `lines`, `text`, `explicit` — tune tolerances per PDF.
5. Visual debugging via `page.to_image().debug_tablefinder().save()`.
6. Crop to region via `page.crop(bbox)`.
7. Filter by position, font name, or font size.
8. Scanned PDFs require OCR first — this skill handles native text only.

---

### tailwind-v4-shadcn
**Location**: `~/.agents/skills/tailwind-v4-shadcn/SKILL.md`
**Trigger**: Initializing React projects with Tailwind v4, setting up shadcn/ui, implementing dark mode, debugging CSS variable issues, migrating from Tailwind v3.

**Rules**:
1. Use `@tailwindcss/vite` plugin (NOT PostCSS).
2. Use `@theme inline` to map CSS variables → Tailwind utilities.
3. Define `:root` and `.dark` at root level (NOT inside `@layer base`).
4. Wrap color values with `hsl()` in `:root`/`.dark`; reference as `var(--color)` in `@layer base`.
5. Set `"tailwind.config": ""` in `components.json`; delete `tailwind.config.ts`.
6. Use `cn()` from `@/lib/utils` for conditional classes.
7. Never use `@apply`, `dark:` variants for semantic colors, or `tailwind.config.ts` for theme.

---

### webapp-testing
**Location**: `~/.agents/skills/webapp-testing/SKILL.md`
**Trigger**: Interacting with and testing local web applications; verifying frontend functionality, debugging UI, capturing screenshots, viewing browser logs.

**Rules**:
1. Write native Python Playwright scripts for testing.
2. Use `scripts/with_server.py` to manage server lifecycle (run `--help` first).
3. Reconnaissance-then-action: navigate → `wait_for_load_state('networkidle')` → screenshot → identify selectors → act.
4. Always launch Chromium in headless mode.
5. Use `sync_playwright()` for synchronous scripts; always close browser.
6. Read static HTML directly for selector discovery when possible.
7. Use descriptive selectors: `text=`, `role=`, CSS selectors, or IDs.
