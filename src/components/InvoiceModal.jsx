import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { FileText, Download, User, Calendar, CheckCircle } from 'lucide-react';
import { exportInvoiceToPDF } from '../utils/exportSalesDaily';
import { formatCOP } from '../utils/formatCurrency';

export default function InvoiceModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Factura de Venta ${invoice.numero_factura}`}
      maxWidth="760px"
    >
      <div className="invoice-modal-content">
        <div className="invoice-header-panel">
          <div className="invoice-title-block">
            <span className="invoice-eyebrow">Comprobante Oficial</span>
            <h3 className="invoice-number">{invoice.numero_factura}</h3>
            <p className="invoice-date">
              <Calendar size={13} /> Emisión: {new Date(invoice.fecha_emision).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="invoice-header-meta">
            <Badge variant="success">{invoice.estado || 'Emitida'}</Badge>
            <div className="invoice-venta-id">ID Venta: #{invoice.venta_id}</div>
          </div>
        </div>

        <div className="invoice-client-panel">
          <div className="invoice-panel-title">
            <User size={14} className="invoice-panel-icon" />
            Datos del Cliente / Comprador
          </div>

          <div className="invoice-client-grid">
            <div className="invoice-client-item">
              <span>Nombre</span>
              <strong>{invoice.cliente_nombre}</strong>
            </div>
            <div className="invoice-client-item">
              <span>Documento</span>
              <strong>{invoice.cliente_documento || 'Consumidor Final'}</strong>
            </div>
            <div className="invoice-client-item">
              <span>Email</span>
              <strong>{invoice.cliente_email || 'N/A'}</strong>
            </div>
            <div className="invoice-client-item">
              <span>Teléfono</span>
              <strong>{invoice.cliente_telefono || 'N/A'}</strong>
            </div>
          </div>
        </div>

        <div className="invoice-table-shell">
          <table className="invoice-detail-table">
            <thead>
              <tr>
                <th>Ítem / Descripción</th>
                <th className="center">Tipo</th>
                <th className="center">Cant.</th>
                <th className="right">Precio Unit.</th>
                <th className="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.detalles || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="invoice-product-name">{item.descripcion}</td>
                  <td className="center">
                    <span className={`invoice-item-pill ${item.tipo_item === 'Servicio' ? 'service' : 'product'}`}>
                      {item.tipo_item || 'Producto'}
                    </span>
                  </td>
                  <td className="center">{item.cantidad}</td>
                  <td className="right mono">{formatCOP(item.precio_unitario)}</td>
                  <td className="right mono strong">{formatCOP(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary-row">
          <div className="invoice-total-box">
            <div className="invoice-total-line">
              <span>Subtotal:</span>
              <span className="mono">{formatCOP(invoice.subtotal)}</span>
            </div>
            {invoice.descuento > 0 && (
              <div className="invoice-total-line discount">
                <span>Descuento:</span>
                <span className="mono">-{formatCOP(invoice.descuento)}</span>
              </div>
            )}
            <div className="invoice-total-line">
              <span>IVA (19%):</span>
              <span className="mono">{formatCOP(invoice.impuestos)}</span>
            </div>
            <div className="invoice-total-line total">
              <span>TOTAL:</span>
              <span className="mono">{formatCOP(invoice.total)} COP</span>
            </div>
          </div>
        </div>

        <div className="invoice-actions">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" icon={Download} onClick={() => exportInvoiceToPDF(invoice)}>
            Descargar Factura en PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
