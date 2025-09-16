// src/dashboard/liquidaciones/PresentarDocumentacionModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Send, FileText, User, Tag, DollarSign, WalletMinimal, Calendar, BadgeAlert, ClipboardList, FilePlus2 } from "lucide-react";
import axios from "@/services/api";
import Table from "@/components/ui/table";
import EventBus from "@/components/EventBus"; // 👈 importar EventBus
import SubirArchivoModal from "./SubirArchivoModal";

const TIPO_CAMBIO = 3.52; // 1 USD = 3.52 S/

const PresentarDocumentacionModal = ({ open, onClose, solicitud }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubirArchivoModal, setShowSubirArchivoModal] = useState(false);

  if (!solicitud) return null;

  const { totalSoles, totalDolares } = useMemo(() => {
    const totalS = documentos.reduce(
      (sum, doc) => sum + parseFloat(doc.total || 0),
      0
    );
    return { totalSoles: totalS, totalDolares: totalS / TIPO_CAMBIO };
  }, [documentos]);

  const handleArchivoSubido = (datosOCR, archivo, tipoDocumento) => {
    const extraidos = datosOCR || {};
    const nuevoDocumento = {
      nombre_archivo: archivo.name,
      numero_documento: extraidos.numero_documento || "ND",
      tipo_documento: tipoDocumento || "Boleta",
      fecha: extraidos.fecha || new Date().toISOString().split("T")[0],
      ruc: extraidos.ruc || "ND",
      razon_social: extraidos.razon_social || "ND",
      total: parseFloat(extraidos.total || 0).toFixed(2),
      archivo, // necesario para abrir
    };
    setDocumentos((prev) => [...prev, nuevoDocumento]);
    console.log("✅ Documento agregado a tabla:", nuevoDocumento);
  };

  const handlePresentarLiquidacion = async () => {
    try {
      setLoading(true);
      await axios.post("/api/liquidaciones/", {
        solicitud_id: solicitud.id,
        documentos,
        total_documentado_soles: totalSoles,
        total_documentado_dolares: totalDolares,
      });
      alert("✅ Liquidación presentada correctamente.");
      onClose();
    } catch (error) {
      console.error("Error presentando liquidación:", error);
      alert("❌ Error al presentar la liquidación.");
    } finally {
      setLoading(false);
    }
  };

  // Abre el archivo en nueva pestaña
  const handleAbrirArchivo = (archivo) => {
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // PresentarDocumentacionModal.jsx
  const handleEliminarDocumento = (doc) => {
    setDocumentos((prev) => prev.filter((d) => d !== doc));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-5xl max-h-[90vh] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              Presentar Documentación
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Info Solicitud */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm sm:text-base">
                <p className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Solicitud:</span>{" "}
                  {solicitud.numero_solicitud}
                </p>
                <p className="flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Solicitante:</span>{" "}
                  {solicitud.solicitante || "—"}
                </p>
                <p className="flex items-center gap-1">
                  <Tag className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Tipo:</span>{" "}
                  {solicitud.tipo_solicitud || "—"}
                </p>
                <p className="flex items-center gap-1">
                  <WalletMinimal className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Monto Soles (S/.):</span>{" "}
                  {solicitud.total_soles || solicitud.monto || "—"}
                </p>
                <p className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Monto Dólares ($):</span>{" "}
                  {solicitud.total_dolares || "—"}
                </p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Fecha:</span>{" "}
                  {solicitud.fecha || "—"}
                </p>
                <p className="flex items-center gap-1">
                  <BadgeAlert className="w-4 h-4 text-gray-800" />
                  <span className="font-semibold">Estado actual:</span>{" "}
                  {solicitud.estado || "Pendiente"}
                </p>
              </CardContent>
            </Card>

            {/* Comprobante OCR */}
            <Card>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FilePlus2 className="w-5 h-5 text-gray-700" />
                    Comprobantes OCR
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setShowSubirArchivoModal(true)}
                    className="bg-gradient-to-r from-violet-400 to-violet-500 hover:from-violet-500 hover:to-violet-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition"
                  >
                    <Plus className="h-4 w-4" /> Agregar
                  </Button>
                </div>

                {/* Tabla */}
                <Table
                  headers={[
                    "Nombre del Archivo",
                    "N° Doc",
                    "Tipo",
                    "Fecha",
                    "RUC",
                    "Razón Social",
                    "Total",
                  ]}
                  data={documentos}
                  emptyMessage="No se han agregado comprobantes todavía."
                  renderRow={(doc) => (
                    <>
                      <td
                        className="px-3 sm:px-4 py-3 text-center cursor-pointer text-blue-600 hover:underline"
                        onClick={() => handleAbrirArchivo(doc.archivo)}
                      >
                        {doc.nombre_archivo}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.numero_documento}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.tipo_documento}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.fecha}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.ruc}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.razon_social}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{doc.total}</td>
                    </>
                  )}
                  onDeleteRow={(doc) => handleEliminarDocumento(doc)}
                />

                <div className="mt-4 text-right font-semibold text-gray-800 text-sm sm:text-base">
                  <p>Total: S/ {totalSoles.toFixed(2)}</p>
                  <p>Total: $ {totalDolares.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Botones */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-sm px-4 py-1.5 rounded-lg shadow-md transition flex items-center gap-2 justify-center cursor-pointer w-full sm:w-auto"
            >
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button
              onClick={handlePresentarLiquidacion}
              disabled={loading || documentos.length === 0}
              className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm px-4 py-1.5 rounded-lg shadow-md transition flex items-center gap-2 justify-center cursor-pointer w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />{" "}
              {loading ? "Presentando..." : "Presentar Liquidación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSubirArchivoModal && (
        <SubirArchivoModal
          idSolicitud={solicitud.id}
          open={showSubirArchivoModal}
          onClose={() => setShowSubirArchivoModal(false)}
          onProcesado={handleArchivoSubido}
        />
      )}
    </>
  );
};

export default PresentarDocumentacionModal;
