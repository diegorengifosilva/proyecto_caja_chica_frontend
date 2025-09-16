// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar usuario desde backend
  const fetchUserFromBackend = async () => {
    try {
      const res = await api.get("usuarios/actual/");
      console.log("Usuario backend:", res.data);
      setAuthUser(res.data);
      localStorage.setItem("auth_user", JSON.stringify(res.data));
    } catch (err) {
      console.error("❌ No se pudo obtener usuario actual:", err.response?.status, err);

      // Solo hacemos logout si es 401 (token inválido)
      if (err.response?.status === 401) {
        logout();
      } else {
        // Si es otro error (CORS, red, etc.), no hacemos logout
        setAuthUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const userData = localStorage.getItem("auth_user");

    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setAuthUser(parsedUser);
        } catch (err) {
          console.error("⚠️ Error al parsear auth_user:", err);
          logout();
          return;
        }
      }

      fetchUserFromBackend();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }) => {
    try {
      const res = await api.post("login/", { email, password });
      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      localStorage.setItem("auth_user", JSON.stringify(user));
      setAuthUser(user);

      return { success: true };
    } catch (err) {
      console.error("Error de inicio de sesión:", err);
      return { success: false, message: "Credenciales inválidas o servidor no disponible" };
    }
  };

  const register = async ({ email, password, nombre, apellido, rol, area }) => {
    try {
      const res = await api.post("register/", { email, password, nombre, apellido, rol, area });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Error de registro:", err);
      return { success: false, message: "No se pudo registrar el usuario" };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    delete api.defaults.headers.common["Authorization"];
    setAuthUser(null);
    window.location.href = "/login";
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No se encontró refresh token");

      const res = await api.post("token/refresh/", { refresh });
      const { access } = res.data;
      localStorage.setItem("access_token", access);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      await fetchUserFromBackend();
    } catch (err) {
      console.error("Error al refrescar token:", err);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{ authUser, setAuthUser, login, register, logout, refreshToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
