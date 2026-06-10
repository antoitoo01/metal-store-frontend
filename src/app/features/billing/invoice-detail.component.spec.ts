import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { InvoiceDetailComponent } from './invoice-detail.component';
import { BillingService } from './billing.service';
import { mockInvoice, mockInvoiceLine } from '../testing/mock-factories';

describe('InvoiceDetailComponent', () => {
  let fixture: ComponentFixture<InvoiceDetailComponent>;
  let queryClient: QueryClient;

  async function createFixture(status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED') {
    queryClient = new QueryClient();
    queryClient.setQueryData(['invoice', 'test-id'], mockInvoice({ invoiceNumber: 'FAC-001', status }));
    queryClient.setQueryData(['invoice-lines', 'test-id'], [mockInvoiceLine({ lineNumber: 1, description: 'Viga IPE 300', quantity: 5, unitPrice: 120 })]);

    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'test-id' } } } },
        provideTanStackQuery(queryClient),
        BillingService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailComponent);
    fixture.detectChanges();
  }

  describe('with DRAFT status', () => {
    beforeEach(async () => createFixture('DRAFT'));

    it('renders invoice number', () => {
      expect(fixture.nativeElement.textContent).toContain('FAC-001');
    });

    it('renders status badge', () => {
      expect(fixture.nativeElement.textContent).toContain('DRAFT');
    });

    it('renders invoice lines', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Viga IPE 300');
      expect(text).toContain('5');
      expect(text).toContain('120');
    });

    it('shows action buttons for DRAFT status', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Emitir');
      expect(text).toContain('Cancelar');
    });

    it('shows add line form for DRAFT', () => {
      expect(fixture.nativeElement.textContent).toContain('Añadir línea');
    });

    it('does not show export PDF for DRAFT', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Exportar PDF');
    });
  });

  describe('with ISSUED status', () => {
    beforeEach(async () => createFixture('ISSUED'));

    it('shows export PDF button', () => {
      expect(fixture.nativeElement.textContent).toContain('Exportar PDF');
    });

    it('does not show add line form', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Añadir línea');
    });
  });
});
