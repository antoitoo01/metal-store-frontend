import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { errorInterceptor, SKIP_TOAST, SKIP_AUTH_REDIRECT } from './error.interceptor';
import { SKIP_AUTH } from './jwt.interceptor';
import { Observable, of, throwError } from 'rxjs';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let auth: { accessToken: string | null; clearAuth: ReturnType<typeof vi.fn>; refreshSession: ReturnType<typeof vi.fn>; sessionExpired: { set: ReturnType<typeof vi.fn> } };
  let notifications: { error: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function configure(token: string | null) {
    auth = {
      accessToken: token,
      clearAuth: vi.fn(),
      refreshSession: vi.fn(),
      sessionExpired: { set: vi.fn() },
    };
    notifications = { error: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  it('limpia auth y redirige a login en 401 sin token', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearAuth).toHaveBeenCalled();
    expect(auth.sessionExpired.set).toHaveBeenCalledWith(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no redirige si SKIP_AUTH_REDIRECT es true', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);

    http.get('/api/test', { context: new HttpContext().set(SKIP_AUTH_REDIRECT, true) }).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearAuth).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no muestra toast si SKIP_TOAST es true', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);

    http.get('/api/test', { context: new HttpContext().set(SKIP_TOAST, true) }).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(notifications.error).not.toHaveBeenCalled();
  });

  it('intenta refresh en 401 cuando hay accessToken', () => {
    configure('test-token');
    auth.refreshSession.mockReturnValue(of(void 0));
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshSession).toHaveBeenCalled();

    const retry = httpMock.expectOne('/api/test');
    retry.flush({});
  });

  it('no refresca si SKIP_AUTH es true', () => {
    configure('test-token');
    const http = TestBed.inject(HttpClient);

    http.get('/api/auth/login', { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(auth.clearAuth).toHaveBeenCalled();
  });

  it('no refresca si no hay accessToken', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(auth.clearAuth).toHaveBeenCalled();
  });

  it('reintenta la request tras refresh exitoso', () => {
    configure('test-token');
    auth.refreshSession.mockReturnValue(of(void 0));
    const http = TestBed.inject(HttpClient);

    const results: unknown[] = [];
    http.get('/api/test').subscribe({ next: (v) => results.push(v) });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/test');
    retryReq.flush({ ok: true });

    expect(results).toEqual([{ ok: true }]);
    expect(auth.clearAuth).not.toHaveBeenCalled();
  });

  it('limpia auth y redirige si refresh falla', () => {
    configure('test-token');
    auth.refreshSession.mockReturnValue(throwError(() => new Error('refresh failed')));
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearAuth).toHaveBeenCalled();
    expect(auth.sessionExpired.set).toHaveBeenCalledWith(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('hace una sola llamada de refresh para multiples 401 concurrentes', () => {
    configure('test-token');

    let resolveRefresh!: () => void;
    auth.refreshSession.mockReturnValue(new Observable<void>((sub) => {
      resolveRefresh = () => { sub.next(); sub.complete(); };
    }));

    const http = TestBed.inject(HttpClient);

    http.get('/api/test1').subscribe({ error: () => {} });
    http.get('/api/test2').subscribe({ error: () => {} });

    const req1 = httpMock.expectOne('/api/test1');
    const req2 = httpMock.expectOne('/api/test2');

    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshSession).toHaveBeenCalledTimes(1);

    resolveRefresh();

    const retry1 = httpMock.expectOne('/api/test1');
    retry1.flush({ ok: true });
    const retry2 = httpMock.expectOne('/api/test2');
    retry2.flush({ ok: true });
  });

  it('reintenta todas las requests concurrentes tras refresh', () => {
    configure('test-token');

    let resolveRefresh!: () => void;
    auth.refreshSession.mockReturnValue(new Observable<void>((sub) => {
      resolveRefresh = () => { sub.next(); sub.complete(); };
    }));

    const http = TestBed.inject(HttpClient);

    const results: string[] = [];
    http.get('/api/test1').subscribe({ next: () => results.push('ok1') });
    http.get('/api/test2').subscribe({ next: () => results.push('ok2') });

    const req1 = httpMock.expectOne('/api/test1');
    const req2 = httpMock.expectOne('/api/test2');

    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    resolveRefresh();

    const retry1 = httpMock.expectOne('/api/test1');
    retry1.flush({ ok: true });
    const retry2 = httpMock.expectOne('/api/test2');
    retry2.flush({ ok: true });

    expect(results).toEqual(['ok1', 'ok2']);
  });
});
