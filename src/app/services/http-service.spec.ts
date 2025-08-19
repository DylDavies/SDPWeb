import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { HttpService } from './http-service';
import { environment } from '../../environments/environment';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpService]
    });
    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test for the GET method
  describe('get', () => {
    it('should send a GET request to the correct endpoint', () => {
      const endpoint = 'test-get';
      const mockData = { message: 'success' };

      service.get(endpoint).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      // Expect a request to the constructed URL and flush it with mock data
      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should send a GET request with HttpParams', () => {
      const endpoint = 'test-params';
      const params = new HttpParams().set('id', '123');

      service.get(endpoint, params).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}?id=123`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('id')).toBe('123');
      req.flush({});
    });
  });

  // Test for the POST method
  describe('post', () => {
    it('should send a POST request with the correct body and endpoint', () => {
      const endpoint = 'test-post';
      const body = { name: 'test' };
      const mockResponse = { id: 1 };

      service.post(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  // Test for the PUT method
  describe('put', () => {
    it('should send a PUT request with the correct body and endpoint', () => {
      const endpoint = 'test-put/1';
      const body = { name: 'updated' };
      const mockResponse = { success: true };

      service.put(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  // Test for the PATCH method
  describe('patch', () => {
    it('should send a PATCH request with the correct body and endpoint', () => {
      const endpoint = 'test-patch/1';
      const body = { name: 'patched' };
      const mockResponse = { success: true };

      service.patch(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  // Test for the DELETE method
  describe('delete', () => {
    it('should send a DELETE request to the correct endpoint', () => {
      const endpoint = 'test-delete/1';
      const mockResponse = { success: true };

      service.delete(endpoint).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});