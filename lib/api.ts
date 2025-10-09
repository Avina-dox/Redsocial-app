// lib/api.ts
import axios from "axios";

// 1) Toma la ENV si existe, si no, usa fallback según modo
const baseURL =
  (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "") ||
  (__DEV__
    ? "http://TU-IP-LAN:8000/api"          // ej: http://192.168.1.70:8000/api
    : "https://alertavecinal.domcloud.dev/api/v1" // tu API en internet (mejor HTTPS)
  );

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});


;

// --- Manejo de token en memoria + helper público ---
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

// --- Interceptors ---
api.interceptors.request.use((config) => {
  // Si hay token en memoria y no viene en el request, lo inyectamos
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
    // Log útil para depurar "Network Error" vs errores del backend
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    console.log("API ERROR →", {
      method: err?.config?.method,
      url,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
      code: err?.code,
    });
    return Promise.reject(err);
  }
);

export default api;
