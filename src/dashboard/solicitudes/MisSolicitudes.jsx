// src/dashboard/solicitudes/MisSolicitudes.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import axios from "@/services/api";
import DetallesSolicitud from "./DetallesSolicitud";
import { STATE_CLASSES, TIPO_SOLICITUD_CLASSES } from "@/components/ui/colors";
import Table from "@/components/ui/table";
import EventBus from "@/components/EventBus";

const MisSolicitudes = ({ open, onClose }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  useEffect(() => {
    if (open) fetchSolicitudes();

    // ⚡ Escuchar eventos de EventBus para actualizar tabla en tiempo real
    const handleSolicitudCreada = (nuevaSolicitud) => {
      setSolicitudes((prev) => [nuevaSolicitud, ...prev]);
    };

    const handleSolicitudEnviada = (solEnviada) => {
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.numero_solicitud === solEnviada.numero_solicitud
            ? { ...s, estado: "Enviada" }
            : s
        )
      );
    };

    // Suscribirse a eventos
    const unsubCreada = EventBus.on("solicitudCreada", handleSolicitudCreada);
    const unsubEnviada = EventBus.on("solicitudEnviada", handleSolicitudEnviada);

    // Cleanup al desmontar
    return () => {
      unsubCreada();
      unsubEnviada();
    };
  }, [open]);

  const fetchSolicitudes = async () => {
    try {
      const res = await axios.get("/boleta/mis_solicitudes/");
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error cargando solicitudes:", err);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const pasaEstado = filtro === "Todos" || s.estado === filtro;
    const pasaFecha =
      (!fechaInicio || new Date(s.fecha) >= new Date(fechaInicio)) &&
      (!fechaFin || new Date(s.fecha) <= new Date(fechaFin));
    return pasaEstado && pasaFecha;
  });

  const handleAccion = (id, accion, solicitud = null) => {
    if (accion === "Ver Detalle" && solicitud) {
      setSolicitudSeleccionada(solicitud);
      setDetalleOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95%] max-h-[90vh] overflow-y-auto bg-white rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-800">
            <FileText className="w-6 h-6" />
            Mis Solicitudes
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <label>Estado:</label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="border rounded-md px-2 py-1"
            >
              <option value="Todos">Todos</option>
              {Object.keys(STATE_CLASSES).map((estado, idx) => (
                <option key={idx} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border rounded-md px-2 py-1"
            />
            <label>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border rounded-md px-2 py-1"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table
            headers={[
              "N°", "Tipo", "S/.", "$", "Fecha", "Concepto", "Estado", "Acción"
            ]}
            data={solicitudesFiltradas}
            emptyMessage="No hay solicitudes en este estado o rango de fechas."
            renderRow={(s) => (
              <>
                <td className="px-1 sm:px-2 py-1 sm:py-2 font-semibold text-center text-xs sm:text-sm">{s.numero_solicitud}</td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${TIPO_SOLICITUD_CLASSES[s.tipo_solicitud] || "bg-gray-200 text-gray-700"}`}>
                    {s.tipo_solicitud}
                  </span>
                </td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">{s.total_soles ? `S/. ${s.total_soles}` : "-"}</td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">{s.total_dolares ? `$ ${s.total_dolares}` : "-"}</td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">{s.fecha}</td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm hidden sm:table-cell">{s.concepto_gasto ?? "-"}</td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATE_CLASSES[s.estado] || "bg-gray-200 text-gray-700"}`}>
                    {s.estado}
                  </span>
                </td>
                <td className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAccion(s.id, "Ver Detalle", s)}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </Button>
                </td>
              </>
            )}
          />
        </div>

        {/* Modal DetalleSolicitud */}
        {detalleOpen && solicitudSeleccionada && (
          <DetallesSolicitud
            open={detalleOpen}
            onClose={() => setDetalleOpen(false)}
            solicitudId={solicitudSeleccionada?.id}
            solicitudInit={solicitudSeleccionada}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MisSolicitudes;
