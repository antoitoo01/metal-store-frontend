import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpContext } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { jwtInterceptor, SKIP_AUTH } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let httpMock: HttpTestingController;

  function configure(accessToken: string | null) {
    const authMock = {
      accessToken,
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  it('agrega Authorization: Bearer cuando hay token', () => {
    configure('test-token');
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('no agrega Authorization cuando no hay token', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);

    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('saltea con SKIP_AUTH context token', () => {
    configure('test-token');
    const http = TestBed.inject(HttpClient);

    http.get('/api/auth/login', { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
