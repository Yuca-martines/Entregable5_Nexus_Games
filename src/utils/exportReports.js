import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formatea una fecha para nombres de archivo: YYYY-MM-DD_HHmm
 */
const getFileTimestamp = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}_${h}${min}`;
};

/**
 * Formatea fecha legible en español
 */
const getReadableDate = () => {
  return new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formateador de moneda COP
 */
const formatCOP = (value) => {
  return `$${Number(value || 0).toLocaleString('es-CO')} COP`;
};

// =========================================================================
// 1. EXPORTACIÓN DE INVENTARIO (EXCEL & PDF)
// =========================================================================

/**
 * Exporta el inventario completo a un archivo Excel (.xlsx)
 */
export const exportInventoryToExcel = (products = []) => {
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Inventario_${timestamp}.xlsx`;

  const rows = products.map((p) => {
    const stockStatus =
      p.stock === 0 ? 'AGOTADO' : p.stock <= 5 ? 'STOCK CRÍTICO' : 'NORMAL';
    return {
      'ID Producto': p.id,
      'Nombre del Producto': p.nombre,
      'Categoría': p.categoria_nombre || 'General',
      'Plataforma': p.plataforma || 'Multiplataforma',
      'Precio Unitario (COP)': Number(p.precio) || 0,
      'Unidades en Stock': Number(p.stock) || 0,
      'Valor Inventario (COP)': (Number(p.precio) || 0) * (Number(p.stock) || 0),
      'Nivel de Alerta': stockStatus,
      'Estado': p.estado || 'Activo',
      'Destacado': p.destacado === 1 ? 'Sí' : 'No'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ancho estimado de columnas para visualización óptima
  worksheet['!cols'] = [
    { wch: 12 }, // ID
    { wch: 35 }, // Nombre
    { wch: 20 }, // Categoría
    { wch: 22 }, // Plataforma
    { wch: 22 }, // Precio
    { wch: 18 }, // Stock
    { wch: 24 }, // Valor
    { wch: 18 }, // Alerta
    { wch: 14 }, // Estado
    { wch: 12 }  // Destacado
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario y Stock');
  XLSX.writeFile(workbook, filename);
};

/**
 * Exporta el inventario completo a un archivo PDF corporativo
 */
export const exportInventoryToPDF = (products = [], _stats = null) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Inventario_${timestamp}.pdf`;

  // Cálculos de resumen
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0),
    0
  );

  // Cabecera Corporativa Nexus Games (Dark Gamer / Gold)
  doc.setFillColor(13, 16, 23); // Fondo oscuro
  doc.rect(0, 0, 297, 36, 'F');

  // Barra de acento dorado
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 36, 297, 2, 'F');

  // Textos Cabecera
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(212, 175, 55); // Dorado Nexus
  doc.text('NEXUS GAMES', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 205, 215);
  doc.text('REPORTE OFICIAL DE INVENTARIO Y DISPONIBILIDAD DE STOCK', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Fecha de Emisión: ${getReadableDate()} | Sistema: Nexus ERP / Store Management`, 14, 30);

  // Tarjetas Resumen Ejecutivo
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(82, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(150, 43, 63, 16, 2, 2, 'F');
  doc.roundedRect(218, 43, 65, 16, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text('TOTAL PRODUCTOS', 18, 48);
  doc.text('UNIDADES EN STOCK', 86, 48);
  doc.text('PRODUCTOS STOCK CRÍTICO', 154, 48);
  doc.text('VALORACIÓN TOTAL ESTIMADA', 222, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 25, 35);
  doc.text(`${totalItems} Ítems`, 18, 55);
  doc.text(`${totalStockUnits} Unidades`, 86, 55);
  
  if (lowStockCount > 0) {
    doc.setTextColor(220, 38, 38); // Rojo alerta
  }
  doc.text(`${lowStockCount} por Reabastecer`, 154, 55);

  doc.setTextColor(16, 140, 90); // Verde valor
  doc.text(formatCOP(totalInventoryValue), 222, 55);

  // Tabla de Productos con autoTable
  const tableHead = [
    ['ID', 'Nombre del Producto', 'Categoría', 'Plataforma', 'Precio Unitario', 'Stock', 'Valor Inv.', 'Alerta', 'Estado']
  ];

  const tableBody = products.map((p) => {
    const stockStatus =
      p.stock === 0 ? 'Agotado' : p.stock <= 5 ? 'Crítico (<=5)' : 'Normal';
    return [
      `#${p.id}`,
      p.nombre,
      p.categoria_nombre || 'General',
      p.plataforma || 'Multiplataforma',
      formatCOP(p.precio),
      `${p.stock} u.`,
      formatCOP((Number(p.precio) || 0) * (Number(p.stock) || 0)),
      stockStatus,
      p.estado || 'Activo'
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 65,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    headStyles: {
      fillColor: [26, 32, 44],
      textColor: [212, 175, 55],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' }
    },
    didParseCell: function (data) {
      // Resaltar celdas de stock bajo o agotado en rojo
      if (data.section === 'body') {
        if (data.column.index === 7) {
          const val = String(data.cell.raw);
          if (val === 'Agotado') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('Crítico')) {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: function (data) {
      // Pie de página oficial
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 145, 155);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial • Confidencial Interno`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
  });

  doc.save(filename);
};

// =========================================================================
// 2. EXPORTACIÓN DE ESTADÍSTICAS GLOBALES DE LA TIENDA (EXCEL & PDF)
// =========================================================================

/**
 * Exporta el resumen estadístico y datos consolidados en Excel (.xlsx) con múltiples hojas
 */
export const exportStatisticsToExcel = (stats, products = [], orders = [], users = []) => {
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Estadisticas_Generales_${timestamp}.xlsx`;
  const workbook = XLSX.utils.book_new();

  // 1. Hoja de KPIs Ejecutivos
  const kpis = [
    { 'Métrica / Indicador Clave': 'Total Usuarios Registrados', 'Valor': stats?.totalUsers || users.length, 'Detalle': 'Base total de usuarios' },
    { 'Métrica / Indicador Clave': 'Total Clientes (Compradores)', 'Valor': stats?.totalClients || users.filter(u => u.rol_id === 3).length, 'Detalle': 'Usuarios rol Cliente' },
    { 'Métrica / Indicador Clave': 'Personal / Empleados', 'Valor': stats?.totalEmployees || users.filter(u => u.rol_id === 2).length, 'Detalle': 'Gestores de inventario' },
    { 'Métrica / Indicador Clave': 'Catálogo de Productos', 'Valor': stats?.totalProducts || products.length, 'Detalle': 'Juegos y periféricos activos' },
    { 'Métrica / Indicador Clave': 'Productos en Stock Crítico (<= 5)', 'Valor': stats?.lowStockProducts || products.filter(p => p.stock <= 5).length, 'Detalle': 'Requieren reabastecimiento' },
    { 'Métrica / Indicador Clave': 'Total de Pedidos Realizados', 'Valor': stats?.totalOrders || orders.length, 'Detalle': 'Órdenes procesadas en tienda' },
    { 'Métrica / Indicador Clave': 'Ingresos Acumulados por Ventas (COP)', 'Valor': Number(stats?.totalRevenue || 0), 'Detalle': formatCOP(stats?.totalRevenue) },
    { 'Métrica / Indicador Clave': 'Servicios Técnicos Disponibles', 'Valor': stats?.totalServices || 0, 'Detalle': 'Mantenimientos y optimización' },
    { 'Métrica / Indicador Clave': 'Fecha de Generación del Informe', 'Valor': getReadableDate(), 'Detalle': 'Hora local del sistema' }
  ];
  const wsKPIs = XLSX.utils.json_to_sheet(kpis);
  wsKPIs['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(workbook, wsKPIs, 'Resumen KPIs');

  // 2. Hoja de Inventario Resumido
  if (products.length > 0) {
    const prodRows = products.map((p) => ({
      ID: p.id,
      Producto: p.nombre,
      Categoría: p.categoria_nombre || 'General',
      Precio: Number(p.precio),
      Stock: Number(p.stock),
      'Estado Stock': p.stock === 0 ? 'AGOTADO' : p.stock <= 5 ? 'CRÍTICO' : 'NORMAL'
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    wsProd['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, wsProd, 'Inventario');
  }

  // 3. Hoja de Pedidos y Ventas
  if (orders.length > 0) {
    const ordRows = orders.map((o) => ({
      'ID Pedido': o.id,
      'Cliente': o.cliente_nombre || 'Cliente General',
      'Documento': o.cliente_documento || 'N/A',
      'Fecha': new Date(o.fecha).toLocaleDateString('es-CO'),
      'Método de Pago': o.metodo_pago,
      'Total (COP)': Number(o.total),
      'Estado': o.estado
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordRows);
    wsOrders['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, wsOrders, 'Ventas y Pedidos');
  }

  // 4. Hoja de Usuarios
  if (users.length > 0) {
    const userRows = users.map((u) => ({
      ID: u.id,
      Nombre: `${u.nombre} ${u.apellido}`,
      Documento: `${u.tipo_documento} ${u.numero_documento}`,
      Email: u.email,
      Teléfono: u.telefono,
      Rol: u.rol_nombre || 'Cliente',
      Estado: u.estado
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userRows);
    wsUsers['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, wsUsers, 'Usuarios Registrados');
  }

  XLSX.writeFile(workbook, filename);
};

/**
 * Exporta el informe ejecutivo de estadísticas a PDF
 */
export const exportStatisticsToPDF = (stats, products = [], orders = [], users = []) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Estadisticas_Generales_${timestamp}.pdf`;

  // Cabecera Corporativa Nexus Games
  doc.setFillColor(13, 16, 23);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 38, 210, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55);
  doc.text('NEXUS GAMES STORE', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 205, 215);
  doc.text('INFORME EJECUTIVO DE RENDIMIENTO, ESTADÍSTICAS & INVENTARIO', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Generado: ${getReadableDate()} | Nivel de Acceso: Dirección y Auditoría`, 14, 30);

  // Tabla Resumen de Indicadores Clave (KPIs)
  const kpiHead = [['Indicador del Negocio', 'Cifra / Resultado', 'Estado / Descripción']];
  const kpiBody = [
    ['Total de Usuarios Registrados', `${stats?.totalUsers || users.length} usuarios`, 'Comunidad total en plataforma'],
    ['Clientes Activos', `${stats?.totalClients || users.filter(u => u.rol_id === 3).length} clientes`, 'Usuarios registrados con perfil de compra'],
    ['Personal Operativo / Empleados', `${stats?.totalEmployees || users.filter(u => u.rol_id === 2).length} empleados`, 'Gestión de tienda e inventario'],
    ['Catálogo Total de Productos', `${stats?.totalProducts || products.length} títulos / periféricos`, 'Disponibles en tienda'],
    ['Alerta de Stock Crítico (<= 5)', `${stats?.lowStockProducts || products.filter(p => p.stock <= 5).length} ítems en alerta`, 'Requieren reposición inmediata'],
    ['Total de Pedidos Realizados', `${stats?.totalOrders || orders.length} pedidos`, 'Histórico de compras procesadas'],
    ['Ingresos Totales por Ventas', formatCOP(stats?.totalRevenue || 0), 'Facturación global acumulada'],
    ['Servicios Técnicos Habilitados', `${stats?.totalServices || 0} servicios`, 'Soporte y mantenimiento gamer']
  ];

  autoTable(doc, {
    head: kpiHead,
    body: kpiBody,
    startY: 46,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [26, 32, 44],
      textColor: [212, 175, 55],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 50 },
      2: { cellWidth: 62, textColor: [100, 110, 125] }
    }
  });

  // Sección de Productos Destacados / Stock Crítico
  const lowStockProds = products.filter((p) => p.stock <= 5);
  if (lowStockProds.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text('ALERTA: PRODUCTOS CON STOCK CRÍTICO O AGOTADOS', 14, finalY);

    const alertHead = [['ID', 'Producto', 'Categoría', 'Stock Actual', 'Precio Unitario', 'Estado']];
    const alertBody = lowStockProds.slice(0, 10).map((p) => [
      `#${p.id}`,
      p.nombre,
      p.categoria_nombre || 'General',
      p.stock === 0 ? 'AGOTADO (0)' : `${p.stock} unidades`,
      formatCOP(p.precio),
      p.stock === 0 ? 'Urgente Reponer' : 'Nivel Bajo'
    ]);

    autoTable(doc, {
      head: alertHead,
      body: alertBody,
      startY: finalY + 4,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 145, 155);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial`,
          14,
          doc.internal.pageSize.height - 8
        );
      }
    });
  }

  doc.save(filename);
};

// =========================================================================
// 3. EXPORTACIÓN DE PEDIDOS / VENTAS (EXCEL & PDF)
// =========================================================================

export const exportOrdersToExcel = (orders = []) => {
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Pedidos_${timestamp}.xlsx`;

  const rows = orders.map((o) => ({
    'ID Pedido': `#${o.id}`,
    'Cliente': o.cliente_nombre || 'Cliente General',
    'Documento Cliente': o.cliente_documento || 'N/A',
    'Fecha de Compra': new Date(o.fecha).toLocaleDateString('es-CO'),
    'Método de Pago': o.metodo_pago,
    'Total Pedido (COP)': Number(o.total),
    'Estado': o.estado
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos Registrados');
  XLSX.writeFile(wb, filename);
};

export const exportOrdersToPDF = (orders = []) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Pedidos_${timestamp}.pdf`;

  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  // Cabecera
  doc.setFillColor(13, 16, 23);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 36, 210, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55);
  doc.text('NEXUS GAMES STORE', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 205, 215);
  doc.text('REPORTE DETALLADO DE VENTAS Y PEDIDOS FACTURADOS', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Fecha: ${getReadableDate()} | Total Facturado: ${formatCOP(totalRevenue)}`, 14, 30);

  const head = [['ID', 'Cliente', 'Documento', 'Fecha', 'Método Pago', 'Total', 'Estado']];
  const body = orders.map((o) => [
    `#${o.id}`,
    o.cliente_nombre || 'N/A',
    o.cliente_documento || 'N/A',
    new Date(o.fecha).toLocaleDateString('es-CO'),
    o.metodo_pago,
    formatCOP(o.total),
    o.estado
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 32, 44], textColor: [212, 175, 55], fontStyle: 'bold' },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 145, 155);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
  });

  doc.save(filename);
};

export const exportSalesToExcel = (sales = []) => {
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Ventas_${timestamp}.xlsx`;

  const rows = sales.map((sale) => ({
    'Número Venta': sale.numero_venta || 'N/A',
    'Número Factura': sale.numero_factura || 'N/A',
    'Cliente': sale.cliente_nombre || 'Cliente General',
    'Documento Cliente': sale.cliente_documento || 'N/A',
    'Fecha / Hora': sale.fecha_hora ? new Date(sale.fecha_hora).toLocaleString('es-CO') : 'N/A',
    'Método Pago': sale.metodo_pago || 'No definido',
    'Estado': sale.estado || 'Completada',
    'Cantidad Ítems': Array.isArray(sale.detalles) ? sale.detalles.length : 0,
    'Total (COP)': Number(sale.total || 0),
    'Productos / Servicios': (sale.detalles || []).map((item) => item.nombre_item || 'Ítem').join(' | ')
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 22 },
    { wch: 18 }, { wch: 15 }, { wch: 14 }, { wch: 18 }, { wch: 50 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, filename);
};

export const exportSalesToPDF = (sales = []) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Ventas_${timestamp}.pdf`;

  const totalRevenue = sales.reduce((acc, sale) => acc + (Number(sale.total) || 0), 0);

  doc.setFillColor(13, 16, 23);
  doc.rect(0, 0, 297, 36, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 36, 297, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55);
  doc.text('NEXUS GAMES STORE', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 205, 215);
  doc.text('REPORTE DETALLADO DE VENTAS COMERCIALES', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Fecha: ${getReadableDate()} | Total Facturado: ${formatCOP(totalRevenue)}`, 14, 30);

  const head = [['Venta', 'Factura', 'Cliente', 'Fecha', 'Método', 'Ítems', 'Total', 'Estado']];
  const body = sales.map((sale) => [
    sale.numero_venta || 'N/A',
    sale.numero_factura || 'N/A',
    sale.cliente_nombre || 'N/A',
    sale.fecha_hora ? new Date(sale.fecha_hora).toLocaleString('es-CO') : 'N/A',
    sale.metodo_pago || 'No definido',
    Array.isArray(sale.detalles) ? sale.detalles.length : 0,
    formatCOP(sale.total),
    sale.estado || 'Completada'
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 32, 44], textColor: [212, 175, 55], fontStyle: 'bold' },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 145, 155);
      doc.text(`Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial`, 14, doc.internal.pageSize.height - 8);
    }
  });

  doc.save(filename);
};

// =========================================================================
// 4. EXPORTACIÓN DE USUARIOS (EXCEL & PDF)
// =========================================================================

export const exportUsersToExcel = (users = []) => {
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Usuarios_${timestamp}.xlsx`;

  const rows = users.map((u) => ({
    'ID': u.id,
    'Nombre Completo': `${u.nombre} ${u.apellido}`,
    'Tipo Documento': u.tipo_documento,
    'Número Documento': u.numero_documento,
    'Email': u.email,
    'Teléfono': u.telefono,
    'Dirección': u.direccion,
    'Rol': u.rol_nombre || 'Cliente',
    'Estado': u.estado
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios del Sistema');
  XLSX.writeFile(wb, filename);
};

export const exportUsersToPDF = (users = []) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const timestamp = getFileTimestamp();
  const filename = `NexusGames_Usuarios_${timestamp}.pdf`;

  // Cabecera
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
  doc.text('DIRECTORIO OFICIAL DE USUARIOS REGISTRADOS Y ROLES (RBAC)', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(160, 165, 175);
  doc.text(`Fecha: ${getReadableDate()} | Total Usuarios: ${users.length}`, 14, 30);

  const head = [['ID', 'Nombre Completo', 'Documento', 'Teléfono', 'Correo Electrónico', 'Dirección', 'Rol Asignado', 'Estado']];
  const body = users.map((u) => [
    `#${u.id}`,
    `${u.nombre} ${u.apellido}`,
    `${u.tipo_documento} ${u.numero_documento}`,
    u.telefono,
    u.email,
    u.direccion || 'N/A',
    u.rol_nombre || 'Cliente',
    u.estado
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 32, 44], textColor: [212, 175, 55], fontStyle: 'bold' },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 145, 155);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} — Nexus Games Store Oficial`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
  });

  doc.save(filename);
};
