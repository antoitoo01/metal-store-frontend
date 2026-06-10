import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { UserListComponent } from './user-list.component';
import { mockPage } from '../testing/mock-factories';

function mockUser(overrides?: Partial<import('../../core/models/api.types').UserResponse>): import('../../core/models/api.types').UserResponse {
  return { id: crypto.randomUUID(), username: 'jperez', email: 'jperez@test.com', role: 'USER', tenantId: 't1', tenantName: 'Test', ...overrides };
}

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['users', { page: 0, q: '' }], mockPage([
      mockUser({ username: 'admin1', email: 'admin@test.com', role: 'ADMIN' }),
      mockUser({ username: 'user1', email: 'user@test.com', role: 'USER' }),
    ]));

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient)],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  it('renders title', () => {
    expect(fixture.nativeElement.textContent).toContain('Usuarios');
  });

  it('renders user list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('admin@test.com');
    expect(text).toContain('user@test.com');
  });

  it('renders role badges', () => {
    expect(fixture.nativeElement.textContent).toContain('ADMIN');
    expect(fixture.nativeElement.textContent).toContain('USER');
  });

  it('renders search input', () => {
    expect(fixture.nativeElement.querySelector('app-search-input')).toBeTruthy();
  });

  it('renders delete buttons', () => {
    const btns = fixture.nativeElement.querySelectorAll('app-button') as NodeListOf<HTMLElement>;
    expect(Array.from(btns).filter(b => b.textContent?.trim() === 'Eliminar').length).toBe(2);
  });
});
