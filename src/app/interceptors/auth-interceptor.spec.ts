import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let mockNext: jasmine.Spy;

  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    mockNext = jasmine.createSpy('next').and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header when token exists', () => {
    const mockToken = 'test-token-12345';
    authServiceSpy.getToken.and.returnValue(mockToken);

    const mockRequest = new HttpRequest('GET', '/api/test');

    interceptor(mockRequest, mockNext);

    expect(authServiceSpy.getToken).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.headers.has('Authorization')).toBe(true);
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should not add Authorization header when token is null', () => {
    authServiceSpy.getToken.and.returnValue(null);

    const mockRequest = new HttpRequest('GET', '/api/test');

    interceptor(mockRequest, mockNext);

    expect(authServiceSpy.getToken).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);

    const passedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(passedRequest.headers.has('Authorization')).toBe(false);
    expect(passedRequest).toBe(mockRequest); // Original request should be passed
  });

  it('should not add Authorization header when token is empty string', () => {
    authServiceSpy.getToken.and.returnValue('');

    const mockRequest = new HttpRequest('GET', '/api/test');

    interceptor(mockRequest, mockNext);

    expect(authServiceSpy.getToken).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);

    const passedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(passedRequest.headers.has('Authorization')).toBe(false);
    expect(passedRequest).toBe(mockRequest); // Original request should be passed
  });

  it('should not modify existing headers except Authorization', () => {
    const mockToken = 'test-token-12345';
    authServiceSpy.getToken.and.returnValue(mockToken);

    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('X-Custom-Header', 'custom-value');
    const mockRequest = new HttpRequest('POST', '/api/test', { data: 'test' }, { headers });

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.headers.get('Content-Type')).toBe('application/json');
    expect(modifiedRequest.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should handle POST requests with token', () => {
    const mockToken = 'post-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    const mockRequest = new HttpRequest('POST', '/api/create', { name: 'test' });

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.method).toBe('POST');
    expect(modifiedRequest.body).toEqual({ name: 'test' });
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should handle PUT requests with token', () => {
    const mockToken = 'put-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    const mockRequest = new HttpRequest('PUT', '/api/update/123', { name: 'updated' });

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.method).toBe('PUT');
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should handle DELETE requests with token', () => {
    const mockToken = 'delete-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    const mockRequest = new HttpRequest('DELETE', '/api/delete/123');

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.method).toBe('DELETE');
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should preserve query parameters when adding token', () => {
    const mockToken = 'query-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    const mockRequest = new HttpRequest('GET', '/api/test?param1=value1&param2=value2');

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.urlWithParams).toContain('param1=value1');
    expect(modifiedRequest.urlWithParams).toContain('param2=value2');
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should override existing Authorization header if present', () => {
    const mockToken = 'new-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', 'Bearer old-token');
    const mockRequest = new HttpRequest('GET', '/api/test', { headers });

    interceptor(mockRequest, mockNext);

    const modifiedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(modifiedRequest.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });
});
