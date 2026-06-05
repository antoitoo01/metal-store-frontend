import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let authMock: { user: ReturnType<typeof signal>; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authMock = {
      user: signal({ id: '1', username: 'test', email: 'test@mail.com', role: 'USER', tenantId: 't1', tenantName: 'Test' }),
      logout: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    };

    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
  });

  it('renders user email', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('test@mail.com');
  });

  it('renders logout button', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
  });

  it('calls logout on AuthService when logout button clicked', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(authMock.logout).toHaveBeenCalled();
  });

  it('shows guest text when no user is authenticated', () => {
    authMock.user.set(null);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Invitado');
  });
});
