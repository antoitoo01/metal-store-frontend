import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ClientListComponent } from './client-list.component';
import { ClientService } from './client.service';
import { mockClient, mockPage } from '../testing/mock-factories';

describe('ClientListComponent', () => {
  let fixture: ComponentFixture<ClientListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['clients', { page: 0, size: 20, q: '' }], mockPage([mockClient({ name: 'ACME Corp' }), mockClient({ name: 'Beta Inc', status: 'INACTIVE' })]));

    await TestBed.configureTestingModule({
      imports: [ClientListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), ClientService],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientListComponent);
    fixture.detectChanges();
  });

  it('renders client list with names', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('ACME Corp');
    expect(text).toContain('Beta Inc');
  });

  it('renders status badges', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Activo');
    expect(text).toContain('Inactivo');
  });

  it('renders action buttons for each client', () => {
    const buttons = fixture.nativeElement.querySelectorAll('app-button') as NodeListOf<HTMLElement>;
    const actionTexts = Array.from(buttons).map(b => b.textContent?.trim());
    expect(actionTexts.some(t => t === 'Activar' || t === 'Desactivar')).toBe(true);
  });
});
