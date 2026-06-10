import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists users with params', () => {
    service.list({ q: 'john', page: 0, size: 10 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/users`);
    expect(req.request.params.get('q')).toBe('john');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.method).toBe('GET');
  });

  it('lists users without params', () => {
    service.list().subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/users`);
    expect(req.request.params.keys().length).toBe(0);
  });

  it('gets user by id', () => {
    service.get('abc-123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/users/abc-123`);
    expect(req.request.method).toBe('GET');
  });

  it('deletes user by id', () => {
    service.delete('abc-123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/users/abc-123`);
    expect(req.request.method).toBe('DELETE');
  });
});
