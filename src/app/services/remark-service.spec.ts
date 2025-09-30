import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RemarkService } from './remark-service';
import { IRemark, IRemarkTemplate, IRemarkField } from '../models/interfaces/IRemark.interface';
import { environment } from '../../environments/environment';

describe('RemarkService', () => {
  let service: RemarkService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockTemplate: IRemarkTemplate = {
    _id: 'template1',
    name: 'Active Template',
    fields: [{ name: 'Overall Feedback', type: 'string' }],
    isActive: true
  };

  const mockRemark: IRemark = {
    _id: 'remark1',
    event: 'event1',
    template: mockTemplate,
    remarkedAt: new Date(),
    entries: [{ field: 'Overall Feedback', value: 'Good session' }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RemarkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get the active template', () => {
    service.getActiveTemplate().subscribe(template => {
      expect(template).toEqual(mockTemplate);
    });

    const req = httpMock.expectOne(`${apiUrl}/remarks/templates/active`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTemplate);
  });

  it('should update the template', () => {
    // By explicitly typing `fields` as IRemarkField[], we satisfy TypeScript's strictness.
    const fields: IRemarkField[] = [{ name: 'New Field', type: 'boolean' }];
    service.updateTemplate(fields).subscribe(template => {
      expect(template).toBeDefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/remarks/templates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fields });
    req.flush(mockTemplate);
  });

  it('should create a remark', () => {
    const eventId = 'event1';
    const entries = [{ field: 'Feedback', value: 'Great!' }];
    service.createRemark(eventId, entries).subscribe(remark => {
      expect(remark).toEqual(mockRemark);
    });

    const req = httpMock.expectOne(`${apiUrl}/remarks/${eventId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ entries });
    req.flush(mockRemark);
  });

  it('should update a remark', () => {
    const remarkId = 'remark1';
    const entries = [{ field: 'Feedback', value: 'Updated!' }];
    service.updateRemark(remarkId, entries).subscribe(remark => {
      expect(remark).toEqual(mockRemark);
    });

    const req = httpMock.expectOne(`${apiUrl}/remarks/${remarkId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ entries });
    req.flush(mockRemark);
  });

  it('should get a remark for an event', () => {
    const eventId = 'event1';
    service.getRemarkForEvent(eventId).subscribe(remark => {
      expect(remark).toEqual(mockRemark);
    });

    const req = httpMock.expectOne(`${apiUrl}/remarks/${eventId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRemark);
  });
});