import { HttpErrorResponse } from '@angular/common/http';

export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Uno o más campos tienen valores inválidos',
  MALFORMED_REQUEST: 'El formato de la solicitud es incorrecto',
  MISSING_TENANT: 'Falta el identificador del taller',
  INVALID_TENANT: 'El identificador del taller no es válido',
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',
  TOKEN_EXPIRED: 'La sesión ha expirado. Inicia sesión de nuevo',
  INVALID_TOKEN: 'La sesión no es válida. Inicia sesión de nuevo',
  UNAUTHORIZED: 'Necesitas iniciar sesión para continuar',
  FORBIDDEN: 'No tienes permiso para realizar esta acción',
  RESOURCE_NOT_FOUND: 'El recurso solicitado no existe',
  METHOD_NOT_ALLOWED: 'La operación solicitada no está permitida',
  RESOURCE_CONFLICT: 'El recurso ya existe o está en conflicto',
  INVALID_STATE_TRANSITION: 'No se puede realizar esta operación en el estado actual',
  MEDIA_TYPE_NOT_SUPPORTED: 'El formato de archivo no es soportado',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Espera unos segundos',
  EXTERNAL_SERVICE_ERROR: 'Error del servicio externo. Intenta de nuevo',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible. Intenta más tarde',
  INTERNAL_ERROR: 'Error inesperado del servidor. Intentá de nuevo',
};

export const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error inesperado';

export function extractErrorMessage(err: HttpErrorResponse): string {
  if (err.error?.code && ERROR_MESSAGES[err.error.code]) {
    return ERROR_MESSAGES[err.error.code];
  }
  if (err.error?.detail) {
    return err.error.detail;
  }
  if (err.error?.message) {
    return err.error.message;
  }
  if (err.statusText && err.statusText !== 'Unknown') {
    return err.statusText;
  }
  return DEFAULT_ERROR_MESSAGE;
}
