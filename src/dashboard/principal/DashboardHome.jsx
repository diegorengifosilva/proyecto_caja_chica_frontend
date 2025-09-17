// src/dashboard/Layout/DashboardHome.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  DollarSign,
  PieChart,
  FileText,
  ClipboardList,
  CheckCircle2,
  FilePlus,
  BarChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Tooltip as RechartsTooltip,
} from "recharts";
import KpiCard from "@/components/ui/KpiCard";
import Table from "@/components/ui/table";
import { STATE_COLORS, TYPE_COLORS } from "@/components/ui/colors";
import ChartWrapped, {
  tooltipFormatter,
  radialTooltipFormatter,
} from "@/components/ui/ChartWrapped";

const DashboardHome = () => {
  const { authUser: user } = useAuth();

  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [solicitudesRecientes, setSolicitudesRecientes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [mostrarDetalle, setMostrarDetalle] = useState(null);

  // saludo dinámico
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // carga datos reales
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/home-stats/");
        setStats(response.data.stats || {});
        setSolicitudesRecientes(response.data.solicitudesRecientes || []);
        setAlertas(response.data.alertas || []);
      } catch (error) {
        console.error("Error cargando estadísticas del Dashboard Home:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // KPIs
  const kpis = [
    {
      label: "Solicitudes Pendientes",
      value: stats.solicitudesPendientes ?? 0,
      icon: ClipboardList,
      gradient: "linear-gradient(135deg,#f97316cc,#fb923c99)",
      tooltip: "Solicitudes que aún no han sido atendidas o aprobadas.",
    },
    {
      label: "Liquidaciones Pendientes",
      value: stats.liquidacionesPendientes ?? 0,
      icon: FileText,
      gradient: "linear-gradient(135deg,#0ea5e9cc,#38bdf899)",
      tooltip: "Solicitudes en estado pendiente de liquidación o aprobación.",
    },
    {
      label: "Liquidaciones Aprobadas (Mes)",
      value: stats.liquidacionesAprobadasMes ?? 0,
      icon: CheckCircle2,
      gradient: "linear-gradient(135deg,#16a34acc,#4ade8099)",
      tooltip: "Cantidad de liquidaciones aprobadas este mes.",
    },
    {
      label: "Monto Total Solicitado (Mes)",
      value: parseFloat(stats.montoTotalSolicitadoMes ?? 0),
      icon: DollarSign,
      gradient: "linear-gradient(135deg,#7c3aedcc,#a78bfa99)",
      tooltip: "Monto total solicitado en caja chica este mes.",
    },
  ];

  const handleNavegar = (url) => {
    alert(`Ir a: ${url}`);
  };

  // ⚡ datos de ejemplo
  const datosTiposSolicitud = [
    { name: "Viáticos", value: 120 },
    { name: "Movilidad", value: 80 },
    { name: "Compras", value: 60 },
    { name: "Otros gastos", value: 40 },
  ];

  const datosEstadosSolicitud = [
    { name: "Pendiente de Envío", value: 15 },
    { name: "Pendiente para Atención", value: 10 },
    { name: "Atendido, Pendiente de Liquidación", value: 8 },
    { name: "Liquidación enviada para Aprobación", value: 12 },
    { name: "Liquidación Aprobada", value: 20 },
    { name: "Rechazado", value: 5 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 font-sans">
      {/* Contenido */}
      <div className="flex-1 flex flex-col px-3 sm:px-6 py-4 lg:py-6">
        {/* Encabezado */}
        <header className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2"
          >
            {getSaludo()},{" "}
            {user?.nombre ? `${user.nombre} ${user.apellido || ""}` : "Usuario"}{" "}
            👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-1 text-sm sm:text-lg md:text-xl text-gray-600 italic"
          >
            Bienvenido a{" "}
            <span className="font-semibold text-blue-600">PMInsight</span>. Aquí
            tienes un resumen de hoy.
          </motion.p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 w-full">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={loading ? 0 : kpi.value}
              icon={kpi.icon}
              gradient={kpi.gradient}
              tooltip={kpi.tooltip}
              decimals={Number.isInteger(kpi.value) ? 0 : 2}
            />
          ))}
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full flex-1">
          {/* Distribución por tipo de solicitud */}
          <ChartWrapped
            title="Distribución por tipo de solicitud"
            icon={<PieChart className="w-5 h-5 text-gray-700" />}
            tooltipFormatter={tooltipFormatter}
            className="flex-1 h-[260px] sm:h-[320px] md:h-[360px] w-full"
          >
            <div className="flex flex-col lg:flex-row gap-4 h-full items-stretch">
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={datosTiposSolicitud}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={3}
                      label
                    >
                      {datosTiposSolicitud.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={TYPE_COLORS[entry.name] || "#334155"}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              {/* Leyenda */}
              <div className="w-full lg:w-48 flex-shrink-0 mt-4 lg:mt-0">
                {datosTiposSolicitud.map((t, i) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 mb-2"
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: TYPE_COLORS[t.name] || "#334155",
                        display: "inline-block",
                        borderRadius: 3,
                      }}
                    />
                    <span className="font-medium">{t.name}</span>
                    <span className="text-gray-500 ml-2">({t.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartWrapped>

          {/* Estado de solicitudes */}
          <ChartWrapped
            title="Estado de solicitudes"
            icon={<BarChart className="w-5 h-5 text-gray-700" />}
            tooltipFormatter={radialTooltipFormatter}
            className="flex-1 h-[260px] sm:h-[320px] md:h-[360px] w-full"
          >
            <div className="flex flex-col lg:flex-row gap-4 h-full items-stretch">
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="10%"
                    outerRadius="95%"
                    barSize={15}
                    data={datosEstadosSolicitud}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      cornerRadius={8}
                    >
                      {datosEstadosSolicitud.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={STATE_COLORS[entry.name] || "#334155"}
                        />
                      ))}
                    </RadialBar>
                    <RechartsTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              {/* Leyenda */}
              <div className="w-full lg:w-48 flex-shrink-0 mt-4 lg:mt-0">
                {datosEstadosSolicitud.map((e, i) => (
                  <div
                    key={e.name}
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 mb-2"
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: STATE_COLORS[e.name] || "#334155",
                        display: "inline-block",
                        borderRadius: 3,
                      }}
                    />
                    <span className="font-medium">{e.name}</span>
                    <span className="text-gray-500 ml-2">({e.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartWrapped>
        </div>

        {/* Tabla */}
        <div className="mb-8 w-full overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Movimientos recientes
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">
              Total: {solicitudesRecientes.length}
            </span>
          </div>
          <Table
            headers={["N°", "Fecha", "Solicitante", "Estado", "Acciones"]}
            data={solicitudesRecientes}
            emptyMessage="No hay movimientos recientes."
            rowsPerPage={5}
            renderRow={(s) => [
              <span className="font-semibold">{s.nro}</span>,
              s.fecha,
              s.solicitante,
              <span
                className={`font-bold ${
                  s.estado === "Aprobada"
                    ? "text-green-600"
                    : s.estado === "Pendiente"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {s.estado}
              </span>,
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg shadow transition flex items-center gap-2 justify-center"
                onClick={() => setMostrarDetalle(s.nro)}
              >
                Revisar
              </button>,
            ]}
          />
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6 w-full">
          {/* Nueva Solicitud */}
          <div
            onClick={() => handleNavegar("/nueva-solicitud")}
            className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition hover:shadow-md hover:scale-105"
          >
            <div className="rounded-full p-2 sm:p-3 mb-3 bg-blue-50 group-hover:bg-blue-100 transition">
              <FilePlus size={24} className="text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-lg">
              Nueva Solicitud
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1">
              Registra una nueva solicitud de gasto.
            </p>
          </div>

          {/* Ver Liquidaciones */}
          <div
            onClick={() => handleNavegar("/liquidaciones")}
            className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition hover:shadow-md hover:scale-105"
          >
            <div className="rounded-full p-2 sm:p-3 mb-3 bg-emerald-50 group-hover:bg-emerald-100 transition">
              <PieChart size={24} className="text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-lg">
              Ver Liquidaciones
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1">
              Consulta el estado de tus liquidaciones.
            </p>
          </div>

          {/* Reportes */}
          <div
            onClick={() => handleNavegar("/reportes")}
            className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition hover:shadow-md hover:scale-105"
          >
            <div className="rounded-full p-2 sm:p-3 mb-3 bg-indigo-50 group-hover:bg-indigo-100 transition">
              <BarChart size={24} className="text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-lg">
              Reportes
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1">
              Estadísticas y reportes ejecutivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
