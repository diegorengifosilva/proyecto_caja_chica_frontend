// src/dashboard/Layout/DashboardHome.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  DollarSign,
  PieChart,
  ClipboardList,
  FileText,
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
import { STATE_COLORS, TYPE_COLORS } from "@/components/ui/colors";
import ChartWrapped, { tooltipFormatter, radialTooltipFormatter } from "@/components/ui/ChartWrapped";

const DashboardHome = () => {
  const { authUser: user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/home-stats/");
        setStats(response.data.stats || {});
      } catch (error) {
        console.error("Error cargando estadísticas del Dashboard Home:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: "Solicitudes Pendientes", value: stats.solicitudesPendientes ?? 0, icon: ClipboardList, gradient: "linear-gradient(135deg,#f97316cc,#fb923c99)", tooltip: "Solicitudes que aún no han sido atendidas o aprobadas." },
    { label: "Liquidaciones Pendientes", value: stats.liquidacionesPendientes ?? 0, icon: FileText, gradient: "linear-gradient(135deg,#0ea5e9cc,#38bdf899)", tooltip: "Solicitudes en estado pendiente de liquidación o aprobación." },
    { label: "Liquidaciones Aprobadas (Mes)", value: stats.liquidacionesAprobadasMes ?? 0, icon: CheckCircle2, gradient: "linear-gradient(135deg,#16a34acc,#4ade8099)", tooltip: "Cantidad de liquidaciones aprobadas este mes." },
    { label: "Monto Total Solicitado (Mes)", value: parseFloat(stats.montoTotalSolicitadoMes ?? 0), icon: DollarSign, gradient: "linear-gradient(135deg,#7c3aedcc,#a78bfa99)", tooltip: "Monto total solicitado en caja chica este mes." },
  ];

  const handleNavegar = (url) => alert(`Ir a: ${url}`);

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
      <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 py-4 lg:py-6">

        {/* Encabezado */}
        <header className="mb-4 sm:mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2"
          >
            {getSaludo()}, {user?.nombre ? `${user.nombre} ${user.apellido || ""}` : "Usuario"} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-1 text-xs sm:text-sm md:text-base text-gray-600 italic"
          >
            Bienvenido a <span className="font-semibold text-blue-600">PMInsight</span>. Aquí tienes un resumen de hoy.
          </motion.p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 w-full">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={loading ? 0 : kpi.value}
              icon={kpi.icon}
              gradient={kpi.gradient}
              tooltip={kpi.tooltip}
              decimals={Number.isInteger(kpi.value) ? 0 : 2}
              className="text-sm sm:text-base md:text-base"
            />
          ))}
        </div>

        {/* Gráficos */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full">
          {/* Tipo de solicitud */}
          <ChartWrapped
            title="Distribución por tipo de solicitud"
            icon={<PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />}
            tooltipFormatter={tooltipFormatter}
            className="flex-1 h-56 sm:h-64 md:h-72 w-full"
          >
            <div className="flex flex-col lg:flex-row gap-2 h-full items-stretch">
              <div className="flex-1 min-h-[150px] sm:min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={datosTiposSolicitud}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="50%"
                      outerRadius="80%"
                      paddingAngle={3}
                      label
                    >
                      {datosTiposSolicitud.map((entry, index) => (
                        <Cell key={index} fill={TYPE_COLORS[entry.name] || "#334155"} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-36 flex-shrink-0 mt-2 lg:mt-0">
                {datosTiposSolicitud.map((t) => (
                  <div key={t.name} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 mb-1">
                    <span style={{ width: 10, height: 10, background: TYPE_COLORS[t.name] || "#334155", display: "inline-block", borderRadius: 2 }} />
                    <span className="font-medium">{t.name}</span>
                    <span className="text-gray-500 ml-1">({t.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartWrapped>

          {/* Estado de solicitudes */}
          <ChartWrapped
            title="Estado de solicitudes"
            icon={<BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />}
            tooltipFormatter={radialTooltipFormatter}
            className="flex-1 h-56 sm:h-64 md:h-72 w-full"
          >
            <div className="flex flex-col lg:flex-row gap-2 h-full items-stretch">
              <div className="flex-1 min-h-[150px] sm:min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="95%" barSize={12} data={datosEstadosSolicitud}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={6}>
                      {datosEstadosSolicitud.map((entry, i) => (
                        <Cell key={i} fill={STATE_COLORS[entry.name] || "#334155"} />
                      ))}
                    </RadialBar>
                    <RechartsTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-36 flex-shrink-0 mt-2 lg:mt-0">
                {datosEstadosSolicitud.map((e) => (
                  <div key={e.name} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 mb-1">
                    <span style={{ width: 10, height: 10, background: STATE_COLORS[e.name] || "#334155", display: "inline-block", borderRadius: 2 }} />
                    <span className="font-medium">{e.name}</span>
                    <span className="text-gray-500 ml-1">({e.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartWrapped>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-4 w-full">
          {[
            { label: "Nueva Solicitud", icon: FilePlus, url: "/nueva-solicitud", bg: "blue", desc: "Registra una nueva solicitud de gasto." },
            { label: "Ver Liquidaciones", icon: PieChart, url: "/liquidaciones", bg: "emerald", desc: "Consulta el estado de tus liquidaciones." },
            { label: "Reportes", icon: BarChart, url: "/reportes", bg: "indigo", desc: "Estadísticas y reportes ejecutivos." },
          ].map((btn) => (
            <div
              key={btn.label}
              onClick={() => handleNavegar(btn.url)}
              className={`group bg-white border border-gray-200 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center cursor-pointer transition hover:shadow-md hover:scale-105`}
            >
              <div className={`rounded-full p-2 sm:p-3 mb-2 bg-${btn.bg}-50 group-hover:bg-${btn.bg}-100 transition`}>
                <btn.icon size={20} className={`text-${btn.bg}-600`} />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{btn.label}</h4>
              <p className="text-xs sm:text-sm text-gray-500 text-center mt-1">{btn.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
