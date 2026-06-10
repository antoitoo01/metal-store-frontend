import { TestBed } from '@angular/core/testing';
import { PrintService } from './print.service';
import { mockQuote, mockQuoteLine, mockInvoice, mockInvoiceLine } from '../../features/testing/mock-factories';

describe('PrintService', () => {
  let service: PrintService;

  beforeEach(() => {
    service = TestBed.inject(PrintService);
  });

  it('generates quote HTML with number', () => {
    const quote = mockQuote({ quoteNumber: 'PRES-001' });
    const lines = [mockQuoteLine()];
    const html = (service as any).quoteHtml(quote, lines);
    expect(html).toContain('PRES-001');
    expect(html).toContain('Presupuesto');
  });

  it('generates invoice HTML with number', () => {
    const invoice = mockInvoice({ invoiceNumber: 'FAC-001' });
    const lines = [mockInvoiceLine()];
    const html = (service as any).invoiceHtml(invoice, lines);
    expect(html).toContain('FAC-001');
    expect(html).toContain('Factura');
  });

  it('includes line items in quote HTML', () => {
    const quote = mockQuote();
    const lines = [mockQuoteLine({ description: 'Viga IPE 200', quantity: 3, unitPrice: 85, totalPrice: 308.55 })];
    const html = (service as any).quoteHtml(quote, lines);
    expect(html).toContain('Viga IPE 200');
    expect(html).toContain('85.00');
    expect(html).toContain('308.55');
  });

  it('includes line items in invoice HTML', () => {
    const invoice = mockInvoice();
    const lines = [mockInvoiceLine({ description: 'PL 10x1000', quantity: 2, unitPrice: 150, totalPrice: 363 })];
    const html = (service as any).invoiceHtml(invoice, lines);
    expect(html).toContain('PL 10x1000');
    expect(html).toContain('150.00');
    expect(html).toContain('363.00');
  });

  it('shows notes section when present', () => {
    const quote = mockQuote({ notes: 'Entrega urgente' });
    const html = (service as any).quoteHtml(quote, []);
    expect(html).toContain('Entrega urgente');
  });

  it('omits notes section when absent', () => {
    const quote = mockQuote({ notes: null });
    const html = (service as any).quoteHtml(quote, []);
    expect(html).not.toContain('>Entrega urgente<');
  });
});
