import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')} COP`;

const getTimestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * EXPORTAR REPORTE DIARIO DE VENTAS A EXCEL (.xlsx) - Requerimiento 6
 */
export const exportDailyReportToExcel = (reportData) => {
  const fecha = reportData?.fecha || new Date().toISOString().split('T')[0];
  const filename = `NexusGames_Reporte_Diario_Ventas_${fecha}.xlsx`;
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen General
  const resumen = reportData?.resumen || {};
  const summaryRows = [
    { 'Métrica': 'Fecha del Reporte', 'Valor': fecha },
    { 'Métrica': 'Total Operaciones de Venta', 'Valor': resumen.total_ventas || 0 },
    { 'Métrica': 'Subtotal (COP)', 'Valor': Number(resumen.subtotal || 0) },
    { 'Métrica': 'Descuentos Aplicados (COP)', 'Valor': Number(resumen.descuentos || 0) },
    { 'Métrica': 'Impuestos IVA 19% (COP)', 'Valor': Number(resumen.impuestos || 0) },
    { 'Métrica': 'Total Recaudado (COP)', 'Valor': Number(resumen.total_recaudado || 0) }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen del Día');

  // Hoja 2: Ventas Detalladas
  const sales = reportData?.ventas || [];
  const salesRows = [];

  sales.forEach((s) => {
    if (s.detalles && s.detalles.length > 0) {
      s.detalles.forEach((d) => {
        salesRows.push({
          'N° Venta': s.numero_venta,
          'Factura': s.numero_factura || 'N/A',
          'Fecha / Hora': new Date(s.fecha_hora).toLocaleTimeString('es-CO'),
          'Cliente': s.cliente_nombre,
          'Documento': s.cliente_documento,
          'Tipo Ítem': d.tipo_item,
          'Producto / Servicio': d.nombre_item,
          'Cantidad': d.cantidad,
          'Precio Unitario (COP)': Number(d.precio_unitario),
          'Subtotal Ítem (COP)': Number(d.subtotal),
          'Método Pago': s.metodo_pago,
          'Estado': s.estado
        });
      });
    } else {
      salesRows.push({
        'N° Venta': s.numero_venta,
        'Factura': s.numero_factura || 'N/A',
        'Fecha / Hora': new Date(s.fecha_hora).toLocaleTimeString('es-CO'),
        'Cliente': s.cliente_nombre,
        'Documento': s.cliente_documento,
        'Tipo Ítem': 'General',
        'Producto / Servicio': 'Varios',
        'Cantidad': 1,
        'Precio Unitario (COP)': Number(s.subtotal),
        'Subtotal Ítem (COP)': Number(s.total),
        'Método Pago': s.metodo_pago,
        'Estado': s.estado
      });
    }
  });

  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  wsSales['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 18 },
    { wch: 14 }, { wch: 36 }, { wch: 10 }, { wch: 20 }, { wch: 20 },
    { wch: 22 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSales, 'Detalle de Ventas');

  XLSX.writeFile(workbook, filename);
};

/**
 * EXPORTAR REPORTE DIARIO DE VENTAS A PDF - Requerimiento 5
 */
export const exportDailyReportToPDF = (reportData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const fecha = reportData?.fecha || new Date().toISOString().split('T')[0];
  const filename = `NexusGames_Reporte_Diario_Ventas_${fecha}.pdf`;
  const resumen = reportData?.resumen || {};
  const sales = reportData?.ventas || [];

  // Cabecera Corporativa Nexus Games
  doc.setFillColor(13, 16, 23);
  doc.rect(0, 0, 297, 36, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 36, 297, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(212, 175, 55);
  doc.text('NEXUS GAMES STORE', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 205, 215);
  doc.text(`REPORTE OFICIAL DIARIO DE VENTAS Y GESTIÓN COMERCIAL (${fecha})`, 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')} | Moneda: COP | Módulo: Quinto Avance SENA`, 14, 30);

  // Cards de resumen ejecutivo
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(82, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(150, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(218, 43, 65, 16, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text('OPERACIONES DEL DÍA', 18, 48);
  doc.text('SUBTOTAL BRUTO', 86, 48);
  doc.text('IMPUESTOS IVA (19%)', 154, 48);
  doc.text('TOTAL RECAUDADO', 222, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 25, 35);
  doc.text(`${resumen.total_ventas || sales.length} Ventas`, 18, 55);
  doc.text(formatCOP(resumen.subtotal), 86, 55);
  doc.text(formatCOP(resumen.impuestos), 154, 55);
  doc.setTextColor(16, 140, 90);
  doc.text(formatCOP(resumen.total_recaudado), 222, 55);

  // Tabla con autoTable
  const head = [['N° Venta', 'Factura', 'Hora', 'Cliente', 'Productos / Servicios', 'Cant.', 'Total Venta', 'Método Pago', 'Estado']];
  const body = sales.map((s) => {
    const itemsDesc = (s.detalles && s.detalles.length > 0)
      ? s.detalles.map(d => `${d.nombre_item} (x${d.cantidad})`).join(', ')
      : 'Artículos Gamer';
    const totalQty = (s.detalles && s.detalles.length > 0)
      ? s.detalles.reduce((acc, d) => acc + d.cantidad, 0)
      : 1;

    return [
      s.numero_venta,
      s.numero_factura || 'N/A',
      new Date(s.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      s.cliente_nombre || 'Cliente General',
      itemsDesc,
      `${totalQty} u.`,
      formatCOP(s.total),
      s.metodo_pago,
      s.estado
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 65,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, valign: 'middle' },
    headStyles: { fillColor: [26, 32, 44], textColor: [212, 175, 55], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 26 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 38 },
      4: { cellWidth: 85 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' },
      7: { cellWidth: 30 },
      8: { cellWidth: 20, halign: 'center' }
    },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 145, 155);
      doc.text(`Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial • Quinto Avance`, 14, doc.internal.pageSize.height - 8);
    }
  });

  doc.save(filename);
};

/**
 * EXPORTAR FACTURAS A EXCEL (.xlsx)
 */
export const exportInvoicesToExcel = (invoices = []) => {
  const filename = `NexusGames_Facturas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const workbook = XLSX.utils.book_new();

  const rows = invoices.map((invoice) => ({
    'Número Factura': invoice.numero_factura || 'N/A',
    'Cliente': invoice.cliente_nombre || 'Cliente General',
    'Documento': invoice.cliente_documento || 'N/A',
    'Email': invoice.cliente_email || 'N/A',
    'Fecha Emisión': invoice.fecha_emision ? new Date(invoice.fecha_emision).toLocaleString('es-CO') : 'N/A',
    'Subtotal': Number(invoice.subtotal || 0),
    'Descuento': Number(invoice.descuento || 0),
    'IVA (19%)': Number(invoice.impuestos || 0),
    'Total': Number(invoice.total || 0),
    'Estado': invoice.estado || 'Emitida',
    'Detalle': (invoice.detalles || []).map((d) => `${d.descripcion} (x${d.cantidad})`).join(' | ')
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 20 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 60 }
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Facturas');
  XLSX.writeFile(workbook, filename);
};

/**
 * EXPORTAR FACTURA OFICIAL DE VENTA A PDF - Requerimientos 7, 8, 9
 */
export const exportInvoiceToPDF = (invoice) => {
  if (!invoice) return;
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const filename = `NexusGames_Factura_${invoice.numero_factura}.pdf`;

  // Cabecera superior
  doc.setFillColor(13, 16, 23);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 42, 210, 2, 'F');

  // Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text('NEXUS GAMES', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 205, 215);
  doc.text('NIT: 901.458.789-0 | Régimen Común', 14, 25);
  doc.text('Calle 100 # 15-20, Bogotá D.C. | Tel: 310 123 4567', 14, 31);
  doc.text('soporte@nexusgames.com | www.nexusgames.com', 14, 37);

  // Recuadro Factura N°
  doc.setFillColor(26, 32, 44);
  doc.roundedRect(125, 10, 71, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55);
  doc.text('FACTURA DE VENTA', 132, 17);
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.numero_factura, 132, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 185, 195);
  doc.text(`Fecha Emisión: ${new Date(invoice.fecha_emision).toLocaleDateString('es-CO')}`, 132, 32);

  // Datos del Cliente
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 182, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DEL ADQUIRIENTE / CLIENTE:', 18, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nombre / Razón Social: ${invoice.cliente_nombre}`, 18, 61);
  doc.text(`Documento Identidad: ${invoice.cliente_documento || 'Consumidor Final'}`, 18, 67);
  doc.text(`Correo Electrónico: ${invoice.cliente_email || 'N/A'}`, 18, 73);

  doc.text(`Dirección Entrega: ${invoice.cliente_direccion || 'Entrega Digital Inmediata'}`, 110, 61);
  doc.text(`Teléfono Contacto: ${invoice.cliente_telefono || 'N/A'}`, 110, 67);
  doc.text(`Estado Factura: ${invoice.estado || 'Emitida'} (Pagada)`, 110, 73);

  // Tabla de Detalles
  const head = [['#', 'Descripción del Producto o Servicio', 'Tipo', 'Cantidad', 'Valor Unitario', 'Subtotal']];
  const body = (invoice.detalles || []).map((d, index) => [
    index + 1,
    d.descripcion,
    d.tipo_item || 'Producto',
    `${d.cantidad} u.`,
    formatCOP(d.precio_unitario),
    formatCOP(d.subtotal)
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 85,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [26, 32, 44], textColor: [212, 175, 55], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Cuadro de Totales a la derecha
  const totalsX = 120;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX, finalY, 76, 38, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Bruto:', totalsX + 4, finalY + 8);
  doc.text(formatCOP(invoice.subtotal), totalsX + 72, finalY + 8, { align: 'right' });

  doc.text('Descuentos Comerciales:', totalsX + 4, finalY + 15);
  doc.text(formatCOP(invoice.descuento || 0), totalsX + 72, finalY + 15, { align: 'right' });

  doc.text('Impuesto IVA (19%):', totalsX + 4, finalY + 22);
  doc.text(formatCOP(invoice.impuestos), totalsX + 72, finalY + 22, { align: 'right' });

  doc.setFillColor(212, 175, 55);
  doc.rect(totalsX, finalY + 26, 76, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 25, 35);
  doc.text('TOTAL A PAGAR:', totalsX + 4, finalY + 33);
  doc.setTextColor(16, 140, 90);
  doc.text(formatCOP(invoice.total), totalsX + 72, finalY + 33, { align: 'right' });

  // Notas al pie
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 145, 155);
  doc.text('Esta factura de venta se expide de acuerdo con los requisitos del Decreto 1625 de 2016 y normatividad vigente.', 14, 275);
  doc.text('Resolución DIAN N° 187640001234 de 2026. Rango autorizado: FACT-2026-00001 al FACT-2026-99999.', 14, 280);
  doc.text('Nexus Games Store • Documento Electrónico Oficial • Quinto Avance SENA', 14, 285);

  doc.save(filename);
};
