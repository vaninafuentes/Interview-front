/**
 * src/lib/auth-events.ts
 * ----------------------
 * Canal de eventos de autenticación.
 *
 * Problema que resuelve:
 *   axios.ts necesita disparar un logout cuando recibe un 401.
 *   Pero axios no puede importar use-auth (sería una dependencia circular).
 *
 * Solución → patrón "listener singleton":
 *   - use-auth registra su función clearSession aquí al montar el Provider
 *   - axios llama a triggerLogout() cuando recibe un 401
 *   - auth-events hace de intermediario sin acoplar los dos módulos
 */

type LogoutListener = () => void;

let logoutListener: LogoutListener | null = null;

export const authEvents = {
  /**
   * Registra la función de logout.
   * Debe llamarse desde AuthProvider al montar.
   */
  setLogoutListener: (fn: LogoutListener) => {
    logoutListener = fn;
  },

  /**
   * Dispara el logout.
   * Llamado desde el interceptor de axios al recibir 401.
   */
  triggerLogout: () => {
    if (logoutListener) {
      logoutListener();
    } else {
      console.warn('[authEvents] triggerLogout llamado sin listener registrado.');
    }
  },
};
