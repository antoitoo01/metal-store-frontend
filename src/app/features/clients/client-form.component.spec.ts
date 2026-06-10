import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ClientFormComponent } from './client-form.component';
import { ClientService } from './client.service';

describe('ClientFormComponent', () => {
  let fixture: ComponentFixture<ClientFormComponent>;

  beforeEach(async () => {
    const queryClient = new QueryClient();
    await TestBed.configureTestingModule({
      imports: [ClientFormComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), ClientService],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormComponent);
    fixture.detectChanges();
  });

  it('renders new client form', () => {
    expect(fixture.nativeElement.textContent).toContain('Nuevo cliente');
  });

  it('shows save button', () => {
    const btn = fixture.nativeElement.querySelector('app-button');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Guardar');
  });
});
