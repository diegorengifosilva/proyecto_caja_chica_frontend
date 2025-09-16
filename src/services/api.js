// src/services/api.js
import axios from "axios";

// Detectar API_URL desde .env o fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/";

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // 🔑 JWT no necesita cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ===== Request Interceptor =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor =====
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.error("⚠️ No hay refresh token");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Refrescar token usando la misma API_URL dinámica
        const res = await axios.post(`${API_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;

        localStorage.setItem("access_token", newAccess);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (err) {
        console.error("🔴 Error al refrescar token:", err);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
