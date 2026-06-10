import { Injectable } from '@angular/core';
import { QuoteResponse, QuoteLineResponse, InvoiceResponse, InvoiceLineResponse } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class PrintService {
  exportQuote(quote: QuoteResponse, lines: QuoteLineResponse[]) {
    const html = this.quoteHtml(quote, lines);
    this.printWindow('Presupuesto', html);
  }

  exportInvoice(invoice: InvoiceResponse, lines: InvoiceLineResponse[]) {
    const html = this.invoiceHtml(invoice, lines);
    this.printWindow('Factura', html);
  }

  private printWindow(title: string, html: string) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  private docHeader(title: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
      .header h1 { font-size: 24px; color: #1a56db; }
      .header .meta { text-align: right; font-size: 11px; color: #666; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 11px; }
      .info-grid .label { font-weight: 600; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: #666; border-bottom: 2px solid #e5e7eb; }
      td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
      td.num, th.num { text-align: right; }
      .totals { margin-left: auto; width: 280px; }
      .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
      .totals-row.total { font-size: 14px; font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px; }
      .notes { margin-top: 32px; font-size: 11px; color: #666; }
      @media print { body { padding: 20px; } }
    </style></head><body>`;
  }

  private docFooter(): string {
    return '</body></html>';
  }

  private quoteHtml(quote: QuoteResponse, lines: QuoteLineResponse[]): string {
    return `${this.docHeader('Presupuesto')}
      <div class="header">
        <div><h1>Presupuesto</h1><p style="font-size:14px;font-weight:600;margin-top:4px">${quote.quoteNumber}</p></div>
        <div class="meta">
          <p>Fecha: ${quote.issueDate}</p>
          ${quote.validUntil ? `<p>Válido hasta: ${quote.validUntil}</p>` : ''}
          <p>Estado: ${quote.status}</p>
        </div>
      </div>
      <div class="info-grid">
        <div><div class="label">Cliente</div><div>${quote.customerName ?? '—'}</div></div>
        <div><div class="label">CIF/NIF</div><div>${quote.customerVat ?? '—'}</div></div>
        <div><div class="label">Dirección</div><div>${quote.customerAddress ?? '—'}</div></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Descripción</th><th class="num">Cantidad</th><th class="num">Precio ud.</th><th class="num">IVA</th><th class="num">Total</th></tr></thead>
        <tbody>${lines.map(l => `<tr>
          <td>${l.lineNumber}</td>
          <td>${l.description}</td>
          <td class="num">${l.quantity}</td>
          <td class="num">${l.unitPrice.toFixed(2)} €</td>
          <td class="num">${l.vatRate}%</td>
          <td class="num">${l.totalPrice.toFixed(2)} €</td>
        </tr>`).join('')}</tbody>
      </table>
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${quote.subtotal.toFixed(2)} €</span></div>
        <div class="totals-row"><span>IVA</span><span>${quote.vatTotal.toFixed(2)} €</span></div>
        <div class="totals-row total"><span>Total</span><span>${quote.total.toFixed(2)} €</span></div>
      </div>
      ${quote.notes ? `<div class="notes"><div class="label">Notas</div><p>${quote.notes}</p></div>` : ''}
    ${this.docFooter()}`;
  }

  private invoiceHtml(invoice: InvoiceResponse, lines: InvoiceLineResponse[]): string {
    return `${this.docHeader('Factura')}
      <div class="header">
        <div><h1>Factura</h1><p style="font-size:14px;font-weight:600;margin-top:4px">${invoice.invoiceNumber}</p></div>
        <div class="meta">
          <p>Fecha: ${invoice.issueDate}</p>
          ${invoice.dueDate ? `<p>Vencimiento: ${invoice.dueDate}</p>` : ''}
          <p>Estado: ${invoice.status}</p>
        </div>
      </div>
      <div class="info-grid">
        <div><div class="label">Cliente</div><div>${invoice.customerName ?? '—'}</div></div>
        <div><div class="label">CIF/NIF</div><div>${invoice.customerVat ?? '—'}</div></div>
        <div><div class="label">Dirección</div><div>${invoice.customerAddress ?? '—'}</div></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Descripción</th><th class="num">Cantidad</th><th class="num">Precio ud.</th><th class="num">IVA</th><th class="num">Total</th></tr></thead>
        <tbody>${lines.map(l => `<tr>
          <td>${l.lineNumber}</td>
          <td>${l.description}</td>
          <td class="num">${l.quantity}</td>
          <td class="num">${l.unitPrice.toFixed(2)} €</td>
          <td class="num">${l.vatRate}%</td>
          <td class="num">${l.totalPrice.toFixed(2)} €</td>
        </tr>`).join('')}</tbody>
      </table>
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)} €</span></div>
        <div class="totals-row"><span>IVA</span><span>${invoice.vatTotal.toFixed(2)} €</span></div>
        <div class="totals-row total"><span>Total</span><span>${invoice.total.toFixed(2)} €</span></div>
      </div>
      ${invoice.notes ? `<div class="notes"><div class="label">Notas</div><p>${invoice.notes}</p></div>` : ''}
    ${this.docFooter()}`;
  }
}
