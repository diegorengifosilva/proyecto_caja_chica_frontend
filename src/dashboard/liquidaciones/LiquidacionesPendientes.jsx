// src/dashboard/liquidaciones/LiquidacionesPendientes.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FolderKanban,
  DollarSign,
  Clock,
  ChartBarDecreasing,
  ChartColumnIncreasing,
} from "lucide-react";
import PresentarDocumentacionModal from "./PresentarDocumentacionModal";
import axios from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TYPE_COLORS,
  TIPO_SOLICITUD_CLASSES,
  STATE_CLASSES,
} from "@/components/ui/colors";
import KpiCard from "@/components/ui/KpiCard";
import Table from "@/components/ui/table";
import ChartWrapped, { tooltipFormatter } from "@/components/ui/ChartWrapped";
import EventBus from "@/components/EventBus";

export default function LiquidacionesPendientes() {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroSolicitante, setFiltroSolicitante] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showPresentarModal, setShowPresentarModal] = useState(false);

  // === Cargar datos ===
  useEffect(() => {
    fetchLiquidaciones();

    EventBus.on("liquidacion_actualizada", fetchLiquidaciones);
    return () => EventBus.off("liquidacion_actualizada", fetchLiquidaciones);
  }, []);

  const fetchLiquidaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token"); // Asegúrate que tu JWT esté guardado aquí
      const res = await axios.get("/boleta/liquidaciones_pendientes/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLiquidaciones(res.data);
    } catch (err) {
      console.error("Error cargando liquidaciones pendientes:", err);
    } finally {
      setLoading(false);
    }
  };

  // === Lista de solicitantes únicos ===
  const solicitantes = useMemo(() => {
    const unique = new Set(liquidaciones.map((s) => s.solicitante_nombre));
    return Array.from(unique);
  }, [liquidaciones]);

  // === Filtro principal para la tabla ===
  const solicitudesFiltradas = useMemo(() => {
    return liquidaciones.filter((s) => {
      const matchSearch =
        s.solicitante_nombre?.toLowerCase().includes(search.toLowerCase()) ||
        s.numero_solicitud.toString().includes(search);

      const matchSolicitante =
        filtroSolicitante === "" || s.solicitante_nombre === filtroSolicitante;

      const matchTipo = filtroTipo === "" || s.tipo_solicitud === filtroTipo;

      const matchFecha =
        (!fechaInicio || new Date(s.fecha) >= new Date(fechaInicio)) &&
        (!fechaFin || new Date(s.fecha) <= new Date(fechaFin));

      return matchSearch && matchSolicitante && matchTipo && matchFecha;
    });
  }, [
    liquidaciones,
    search,
    filtroSolicitante,
    filtroTipo,
    fechaInicio,
    fechaFin,
  ]);

  // === KPIs ===
  const stats = useMemo(() => {
    const total = solicitudesFiltradas.length;
    const totalSoles = solicitudesFiltradas.reduce(
      (sum, l) => sum + (l.monto_soles || 0),
      0
    );
    const totalDolares = solicitudesFiltradas.reduce(
      (sum, l) => sum + (l.monto_dolares || 0),
      0
    );
    const promedio = total ? (totalSoles / total).toFixed(2) : 0;
    return { total, totalSoles, totalDolares, promedio };
  }, [solicitudesFiltradas]);

  // === Datos para gráficos ===
  const dataTipo = useMemo(() => {
    return Object.entries(
      solicitudesFiltradas.reduce((acc, l) => {
        acc[l.tipo_solicitud] = (acc[l.tipo_solicitud] || 0) + 1;
        return acc;
      }, {})
    ).map(([tipo, value]) => ({ name: tipo, value }));
  }, [solicitudesFiltradas]);

  const dataMontoPorTipo = useMemo(() => {
    return Object.entries(
      solicitudesFiltradas.reduce((acc, l) => {
        acc[l.tipo_solicitud] = (acc[l.tipo_solicitud] || 0) + (l.monto_soles || 0);
        return acc;
      }, {})
    ).map(([tipo, value]) => ({ name: tipo, value: Number(value.toFixed(2)) }));
  }, [solicitudesFiltradas]);

  // === Acción en tabla ===
  const handleAccion = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowPresentarModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-center md:justify-start items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-black">
          <FolderKanban className="w-5 sm:w-6 h-5 sm:h-6" /> Liquidaciones Pendientes
        </h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 text-center">
        {[
          { label: "Total Pendientes", value: stats.total, gradient: "linear-gradient(135deg, #f97316cc, #fb923c99)", icon: Clock, tooltip: "Número total de solicitudes pendientes." },
          { label: "Monto Total (S/)", value: stats.totalSoles, gradient: "linear-gradient(135deg, #3b82f6cc, #60a5fa99)", icon: DollarSign, tooltip: "Monto acumulado en soles.", decimals: 2 },
          { label: "Monto Total ($)", value: stats.totalDolares, gradient: "linear-gradient(135deg, #10b981cc, #34d39999)", icon: DollarSign, tooltip: "Monto acumulado en dólares.", decimals: 2 },
          { label: "Promedio por Solicitud (S/)", value: stats.promedio, gradient: "linear-gradient(135deg, #f59e0bcc, #fcd34d99)", icon: DollarSign, tooltip: "Promedio por solicitud.", decimals: 2 },
        ].map((kpi, idx) => <KpiCard key={idx} {...kpi} />)}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ChartWrapped title="Montos por Tipo de Solicitud (S/.)" icon={<ChartBarDecreasing className="w-4 h-4" />} className="h-72" tooltipFormatter={(val) => `S/ ${val.toLocaleString()}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataMontoPorTipo} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(val) => `S/ ${val.toLocaleString()}`} />
              <Bar dataKey="value" barSize={35}>
                {dataMontoPorTipo.map((entry, i) => (
                  <Cell key={i} fill={TYPE_COLORS[entry.name] || "#9CA3AF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapped>

        <ChartWrapped title="Distribución por Tipo" icon={<ChartColumnIncreasing className="w-4 h-4" />} className="h-72" tooltipFormatter={tooltipFormatter}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataTipo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="value" barSize={35}>
                {dataTipo.map((entry, i) => (
                  <Cell key={i} fill={TYPE_COLORS[entry.name] || "#9CA3AF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapped>
      </div>

      {/* Tabla */}
      <Table
        headers={["N° Solicitud","Tipo","Monto (S/.)","Monto ($)","Fecha","Concepto","Estado","Acción"]}
        data={solicitudesFiltradas}
        loading={loading}
        emptyMessage="No hay solicitudes en este estado o rango de fechas."
        renderRow={(s) => (
          <>
            <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-center">{s.numero_solicitud}</td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
              <span className={`text-xs px-2 py-1 rounded-full ${TIPO_SOLICITUD_CLASSES[s.tipo_solicitud] || "bg-gray-200 text-gray-700"}`}>{s.tipo_solicitud}</span>
            </td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{s.monto_soles ? `S/. ${s.monto_soles}` : "-"}</td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{s.monto_dolares ? `$ ${s.monto_dolares}` : "-"}</td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{s.fecha}</td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{s.concepto_gasto ?? "-"}</td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
              <span className={`text-xs px-2 py-1 rounded-full ${STATE_CLASSES[s.estado] || "bg-gray-200 text-gray-700"}`}>{s.estado}</span>
            </td>
            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
              <Button variant="outline" size="sm" onClick={() => handleAccion(s)} className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> Presentar
              </Button>
            </td>
          </>
        )}
      />

      {/* Modal */}
      {showPresentarModal && (
        <PresentarDocumentacionModal
          open={showPresentarModal}
          onClose={() => setShowPresentarModal(false)}
          solicitud={selectedSolicitud}
        />
      )}
    </div>
  );
}
