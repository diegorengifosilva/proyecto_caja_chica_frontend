// src/services/documentoService.js
import axios from "axios";

/* 🌐 URL dinámica: local en desarrollo, Render en producción */
const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000/api/boleta/documentos"
    : "https://proyecto-caja-chica-backend.onrender.com/api/boleta/documentos";

/* ========== 🧩 SERVICIO DE DOCUMENTOS OCR Y GASTOS ========== */

/**
 * Procesa un documento (imagen/PDF) con OCR en el backend.
 * Endpoint: /boleta/documentos/procesar/
 *
 * @param {FormData} formData - Incluye: archivo, tipo_documento, id_solicitud
 * @returns {Object} - Datos extraídos (fecha, ruc, total, etc.)
 */
export const procesarDocumentoOCR = async (formData) => {
  try {
    // ⚡ DEBUG: mostrar lo que se está mandando
    for (let pair of formData.entries()) {
      console.log("📤 Enviando:", pair[0], pair[1]);
    }

    const response = await axios.post(`${API_BASE}/procesar/`, formData, {
      headers: {
        Accept: "application/json",
        // axios ya setea boundary automáticamente
      },
      timeout: 60000, // ⏳ más tiempo por red móvil lenta
    });

    const { datos_detectados } = response.data || {};
    console.log("✅ OCR recibido:", datos_detectados);

    // Validaciones mínimas
    const camposObligatorios = ["ruc"];
    const faltantes = camposObligatorios.filter(
      (campo) =>
        !datos_detectados?.[campo] ||
        datos_detectados[campo] === "No encontrado" ||
        datos_detectados[campo] === ""
    );

    if (faltantes.length > 0) {
      console.warn(`⚠️ OCR incompleto. Faltan: ${faltantes.join(", ")}`);
    }

    return datos_detectados || {};
  } catch (error) {
    console.error("❌ Error procesando OCR:", error);

    if (error.response) {
      console.error("📡 Respuesta backend:", error.response.data);
    } else if (error.request) {
      console.error("📡 Sin respuesta del servidor (móvil?):", error.request);
    }

    throw new Error(
      error.response?.data?.error ||
        "No se pudo procesar el documento. Intenta nuevamente con otra imagen o revisa tu conexión."
    );
  }
};

/**
 * Prueba de OCR con un documento de ejemplo (debug).
 * Endpoint: /boleta/documentos/test-ocr/
 */
export const testOCR = async () => {
  try {
    const response = await axios.get(`${API_BASE}/test-ocr/`);
    console.log("🧪 Test OCR:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error en test OCR:", error);
    throw new Error("No se pudo ejecutar el test de OCR.");
  }
};

/**
 * Guarda un documento de gasto procesado (pos-OCR, editable por usuario).
 * Endpoint: /boleta/documentos/guardar/
 *
 * @param {FormData} formData - Incluye: solicitud_id, archivo, ruc, total, etc.
 * @returns {Object} - Confirmación del backend
 */
export const guardarDocumentoGasto = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE}/guardar/`, formData, {
      headers: {
        Accept: "application/json",
      },
      timeout: 60000,
    });

    console.log("✅ Documento guardado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error guardando documento:", error);

    if (error.response) {
      console.error("📡 Respuesta backend:", error.response.data);
    } else if (error.request) {
      console.error("📡 Sin respuesta del servidor (móvil?):", error.request);
    }

    throw new Error(
      error.response?.data?.detail ||
        "Error al guardar el documento. Verifica los datos e intenta nuevamente."
    );
  }
};

/**
 * Obtiene todos los documentos vinculados a una solicitud.
 * Endpoint: /boleta/documentos/solicitud/<id>/
 *
 * @param {number} solicitudId - ID de la solicitud
 * @returns {Array} - Lista de documentos de esa solicitud
 */
export const obtenerDocumentosPorSolicitud = async (solicitudId) => {
  try {
    const response = await axios.get(`${API_BASE}/solicitud/${solicitudId}/`, {
      timeout: 30000,
    });

    console.log(`📥 Documentos de solicitud ${solicitudId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error obteniendo documentos por solicitud:", error);

    throw new Error("No se pudieron cargar los documentos de la solicitud.");
  }
};
