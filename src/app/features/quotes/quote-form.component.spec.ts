import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { QuoteFormComponent } from './quote-form.component';
import { QuoteService } from './quote.service';
import { ClientService } from '../clients/client.service';
import { mockQuote, mockPage, mockClient } from '../testing/mock-factories';

describe('QuoteFormComponent', () => {
  let fixture: ComponentFixture<QuoteFormComponent>;
  let queryClient: QueryClient;

  describe('create mode', () => {
    beforeEach(async () => {
      queryClient = new QueryClient();
      queryClient.setQueryData(['clients', { page: 0, size: 200 }], mockPage([mockClient({ name: 'Cliente A' })]));

      await TestBed.configureTestingModule({
        imports: [QuoteFormComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
          provideTanStackQuery(queryClient),
          QuoteService,
          ClientService,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(QuoteFormComponent);
      fixture.detectChanges();
    });

    it('renders create form', () => {
      expect(fixture.nativeElement.textContent).toContain('Nuevo presupuesto');
    });

    it('shows client select', () => {
      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeTruthy();
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      queryClient = new QueryClient();
      queryClient.setQueryData(['quote', 'edit-id'], mockQuote({ quoteNumber: 'PRES-001', customerName: 'Edit Client' }));

      await TestBed.configureTestingModule({
        imports: [QuoteFormComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'edit-id' } } } },
          provideTanStackQuery(queryClient),
          QuoteService,
          ClientService,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(QuoteFormComponent);
      fixture.detectChanges();
    });

    it('renders edit form', () => {
      expect(fixture.nativeElement.textContent).toContain('Editar presupuesto');
    });

    it('pre-fills customer name from existing quote', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Edit Client');
    });

    it('does not show client select in edit mode', () => {
      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeFalsy();
    });
  });
});
