# Migración a httpOnly Cookie para JWT — Backend

## ¿Por qué?

El frontend ya no guarda el `accessToken` en `localStorage`. En su lugar, el backend setea una cookie httpOnly con el JWT después del login. Esto elimina el riesgo de XSS robando tokens.

## Cambios necesarios

---

### 1. `CookieBearerTokenResolver` — leer JWT de la cookie

Spring Security Resource Server por defecto lee el token del header `Authorization: Bearer <jwt>`. Necesitamos un resolver custom que primero intente la cookie, y caiga al header como fallback.

```kotlin
@Component
class CookieBearerTokenResolver : BearerTokenResolver {

    companion object {
        private const val COOKIE_NAME = "access_token"
    }

    override fun resolve(request: HttpServletRequest): String {
        // 1. Intentar desde cookie
        request.cookies?.firstOrNull { it.name == COOKIE_NAME }?.value?.let { return it }

        // 2. Fallback: header Authorization (útil para testing/postman)
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            return header.removePrefix("Bearer ")
        }

        throw BearerTokenAuthenticationException(
            OAuth2Error("invalid_token", "Token not found in cookie or Authorization header", null)
        )
    }
}
```

---

### 2. Configurar el Resource Server con el resolver custom

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val cookieResolver: CookieBearerTokenResolver,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityChain {
        return http
            .oauth2ResourceServer {
                it.bearerTokenResolver(cookieResolver)
                it.jwt(Customizer.withDefaults())
            }
            // resto de la config
            .build()
    }
}
```

---

### 3. Login — setear la cookie en la respuesta

Cuando el login es exitoso, en vez de (o además de) devolver el token en el body, setéalo como cookie httpOnly.

```kotlin
@Component
class AuthService(/* ... */) {

    fun login(request: LoginRequest, response: HttpServletResponse): LoginResponse {
        val auth = authenticate(request.email, request.password)
        val token = tokenProvider.generateToken(auth)

        val cookie = Cookie("access_token", token).apply {
            isHttpOnly = true
            isSecure = true           // false en dev (localhost sin HTTPS)
            path = "/"
            maxAge = 3600             // match expiresIn
            // Sin SameSite si no andan las requests cross-site
        }
        response.addCookie(cookie)

        return LoginResponse(
            // token sigue en body para compatibilidad, 
            // pero frontend lo ignora
            accessToken = token,
            tokenType = "Bearer",
            // ...
        )
    }
}
```

⚠️ **Importante**: En el perfil `dev` (H2 + `permitAll`), el login no debería setear cookies ni esperar JWT. La autenticación real solo aplica en `prod`.

---

### 4. Logout — eliminar la cookie

```kotlin
@PostMapping("/logout")
fun logout(response: HttpServletResponse) {
    val cookie = Cookie("access_token", null).apply {
        isHttpOnly = true
        isSecure = true
        path = "/"
        maxAge = 0  // elimina la cookie
    }
    response.addCookie(cookie)
}
```

---

### 5. Refresh token — actualizar la cookie

Si tenés refresh token, al refrescar también actualizás la cookie con el nuevo JWT:

```kotlin
@PostMapping("/refresh")
fun refresh(request: HttpServletRequest, response: HttpServletResponse): LoginResponse {
    // Validar refresh token (desde body o cookie separada)
    val newToken = tokenProvider.refresh(...)

    val cookie = Cookie("access_token", newToken).apply {
        isHttpOnly = true
        isSecure = true
        path = "/"
        maxAge = 3600
    }
    response.addCookie(cookie)

    return LoginResponse(accessToken = newToken, ...)
}
```

---

### 6. Perfil `dev` — sin cookies

En el perfil `dev` (H2 + `permitAll`), no hay autenticación real. No setees cookies. El frontend usa el header `X-Tenant-Id` para el tenant. El `CookieBearerTokenResolver` debe ignorarse en dev o permitir el fallback al `Authorization` header.

Opción: tener dos configuraciones de security o condicional:

```kotlin
@Profile("dev")
@Configuration
class DevSecurityConfig {
    // security permitAll — sin cookies, sin JWT
}

@Profile("prod")
@Configuration
class ProdSecurityConfig(
    private val cookieResolver: CookieBearerTokenResolver,
) {
    // security con OAuth2 + cookie resolver
}
```

---

### 7. Opcional: Nginx hardening (si aplica)

Si tenés Nginx reverse-proxyando el backend, reforzá los flags de la cookie:

```nginx
proxy_cookie_path / "/; HttpOnly; Secure; SameSite=Strict";
```

## Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `CookieBearerTokenResolver.kt` | **Nuevo** — extrae JWT de cookie |
| `SecurityConfig.kt` | Inyectar `CookieBearerTokenResolver` |
| `AuthController.kt` | En login/refresh: escribir cookie |
| `AuthController.kt` | En logout: eliminar cookie |
| Perfil dev | No tocar cookies, sigue como está |

## Frontend (ya implementado)

- `AuthService` — no lee/escribe `localStorage`, usa `#tenantId` en memoria
- `jwt.interceptor.ts` — eliminado (el browser maneja la cookie)
- `app.config.ts` — `APP_INITIALIZER` llama `auth.initialize()` que hace GET `/api/auth/me` para restaurar sesión al recargar
- `tenant.interceptor.ts` — inyecta `AuthService.tenantId` (en memoria)
- `error.interceptor.ts` — limpia estado de auth con `auth.clearAuth()`
