import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { InvoiceFormComponent } from './invoice-form.component';
import { BillingService } from './billing.service';
import { mockInvoice } from '../testing/mock-factories';

describe('InvoiceFormComponent', () => {
  let fixture: ComponentFixture<InvoiceFormComponent>;
  let queryClient: QueryClient;

  describe('create mode', () => {
    beforeEach(async () => {
      queryClient = new QueryClient();

      await TestBed.configureTestingModule({
        imports: [InvoiceFormComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
          provideTanStackQuery(queryClient),
          BillingService,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(InvoiceFormComponent);
      fixture.detectChanges();
    });

    it('renders create form', () => {
      expect(fixture.nativeElement.textContent).toContain('Nueva factura');
    });

    it('shows save button with create label', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Crear factura');
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      queryClient = new QueryClient();
      queryClient.setQueryData(['invoice', 'edit-id'], mockInvoice({ invoiceNumber: 'FAC-001', customerName: 'Edit Client' }));

      await TestBed.configureTestingModule({
        imports: [InvoiceFormComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'edit-id' } } } },
          provideTanStackQuery(queryClient),
          BillingService,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(InvoiceFormComponent);
      fixture.detectChanges();
    });

    it('renders edit form', () => {
      expect(fixture.nativeElement.textContent).toContain('Editar factura');
    });

    it('shows save button with edit label', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Guardar cambios');
    });
  });
});
