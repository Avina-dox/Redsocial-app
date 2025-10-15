// /app/lib/api.ts
import axios from "axios";

/**
 * RESUMEN:
 * - Usa EXPO_PUBLIC_API_URL si existe (recomendado), p.ej.: https://tudominio.com/api/v1
 * - Si no existe:
 *    - En dev: LAN con /api/v1 (cámbialo a tu IP)
 *    - En prod: dominio público con /api/v1 (HTTPS)
 *
 * NOTA: Deja EXPO_PUBLIC_API_URL apuntando DIRECTO a /api/v1 para evitar dobles prefijos.
 *       (ej: EXPO_PUBLIC_API_URL=https://alertavecinal.domcloud.dev/api/v1)
 */

// 1) Resolver base URL con saneo de slashes
function normalizeBase(url: string) {
  // quita todos los "/" del final
  return (url ?? "").replace(/\/+$/, "");
}

const envUrl = normalizeBase(process.env.EXPO_PUBLIC_API_URL ?? "");
const fallbackDev = "http://TU-IP-LAN:8000/api/v1";              // <-- cámbialo por tu IP LAN
const fallbackProd = "https://alertavecinal.domcloud.dev/api/v1"; // <-- tu dominio público (HTTPS)
const baseURL = envUrl || (__DEV__ ? fallbackDev : fallbackProd);

// 2) Crear instancia Axios
const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    // OJO: si haces multipart con FormData, NO sobreescribas este header al llamar (o déjalo que Axios lo maneje)
    "Content-Type": "application/json",
  },
});

// --- Manejo de token en memoria + helpers públicos ---
let authToken: string | null = null;

/** Setea o limpia el Bearer token en Axios (y en memoria). */
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.Authorization;
  }
}

/** (Opcional) obtener el token actual por si lo necesitas en tu app */
export function getAuthToken() {
  return authToken;
}

// --- Interceptors ---
api.interceptors.request.use((config) => {
  // Inyecta Bearer si hay token y no viene ya en el request
  if (authToken && !config.headers?.Authorization) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${authToken}`,
    };
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Log compacto pero útil para depurar (especialmente en dispositivo físico)
    const method = err?.config?.method?.toUpperCase();
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Evita explotar el log con cuerpos enormes
    const safeData =
      data && typeof data === "object"
        ? JSON.stringify(data).slice(0, 2000)
        : String(data || "").slice(0, 2000);

    console.log("API ERROR →", {
      method,
      url,
      status,
      data: safeData,
      message: err?.message,
      code: err?.code,
    });

    return Promise.reject(err);
  }
);

export default api;
