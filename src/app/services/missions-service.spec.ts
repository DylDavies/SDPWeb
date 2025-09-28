import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MissionService } from './missions-service';
import { IMissions } from '../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../models/enums/mission-status.enum';
import { environment } from '../../environments/environment';
import { IDocument } from '../models/interfaces/IDocument.interface';

describe('MissionService', () => {
  let service: MissionService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  // Mock document data to be used within the mission mock
  const mockDocument: IDocument = {
    _id: 'doc1',
    fileKey: 'key123',
    originalFilename: 'mission-doc.pdf',
    contentType: 'application/pdf',
    uploadedBy: 'user1',
    createdAt: new Date(),
  };

  // Mock mission data for use in tests
  const mockMission: IMissions = {
    _id: 'mission1',
    bundleId: 'bundle1',
    document: mockDocument,
    student: 'student1',
    tutor: 'tutor1',
    remuneration: 100,
    commissionedBy: 'commissioner1',
    dateCompleted: new Date(),
    hoursCompleted: 5,
    status: EMissionStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MissionService
      ]
    });
    service = TestBed.inject(MissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMissions', () => {
    it('should send a GET request to the /missions endpoint', () => {
      const mockMissionsArray = [mockMission];
      service.getMissions().subscribe(missions => {
        expect(missions).toEqual(mockMissionsArray);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMissionsArray);
    });
  });

  describe('getMissionsByStudentId', () => {
    it('should send a GET request to the /missions/student/:studentId endpoint', () => {
      const studentId = 'student1';
      const mockMissionsArray = [mockMission];
      
      service.getMissionsByStudentId(studentId).subscribe(missions => {
        expect(missions).toEqual(mockMissionsArray);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/student/${studentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMissionsArray);
    });
  });

  describe('getMissionsByBundleId', () => {
    it('should send a GET request to the /missions/bundle/:bundleId endpoint', () => {
      const bundleId = 'bundle1';
      const mockMissionsArray = [mockMission];
      
      service.getMissionsByBundleId(bundleId).subscribe(missions => {
        expect(missions).toEqual(mockMissionsArray);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/bundle/${bundleId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMissionsArray);
    });
  });

  describe('getMissionById', () => {
    it('should send a GET request to the /missions/:id endpoint', () => {
      const missionId = 'mission1';
      service.getMissionById(missionId).subscribe(mission => {
        expect(mission).toEqual(mockMission);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMission);
    });
  });

  describe('createMission', () => {
    it('should send a POST request with mission data', () => {
      const missionData: Partial<IMissions> = {
        student: 'student1',
        tutor: 'tutor1',
        remuneration: 100,
      };

      service.createMission(missionData).subscribe(mission => {
        expect(mission).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/missions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(missionData);
      req.flush(mockMission);
    });
  });

  describe('updateMission', () => {
    it('should send a PATCH request with update data', () => {
      const missionId = 'mission1';
      const updateData = { remuneration: 500 };

      service.updateMission(missionId, updateData).subscribe(mission => {
        expect(mission.remuneration).toBe(500);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush({ ...mockMission, ...updateData });
    });
  });

  describe('setMissionStatus', () => {
    it('should send a PATCH request to update the status', () => {
      const missionId = 'mission1';
      const newStatus = EMissionStatus.Completed;

      service.setMissionStatus(missionId, newStatus).subscribe(mission => {
        expect(mission.status).toBe(newStatus);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      req.flush({ ...mockMission, status: newStatus });
    });
  });

  describe('deleteMission', () => {
    it('should send a DELETE request to the specified mission ID', () => {
      const missionId = 'mission1';
      service.deleteMission(missionId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null); // DELETE requests often have no body in response
    });
  });
});
