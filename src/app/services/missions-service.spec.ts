import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MissionService } from './missions-service';
import { IMissions } from '../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../models/enums/mission-status.enum';
import { environment } from '../../environments/environment';

describe('MissionService', () => {
  let service: MissionService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  // Mock data for use in tests
  const mockMission: IMissions = {
    _id: 'mission1',
    bundleId: 'bundle1',
    documentPath: 'doc.pdf',
    documentName: 'doc.pdf',
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
    // Ensure that there are no outstanding requests after each test
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMissions', () => {
    it('should send a GET request to the /missions endpoint', () => {
      const mockMissionsArray = [mockMission];
      service.getMissions().subscribe(missions => {
        expect(missions.length).toBe(1);
        expect(missions).toEqual(mockMissionsArray);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions`);
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
    it('should send a POST request to the /missions endpoint', () => {
      const newMissionData = new FormData();
      newMissionData.append('document', new File([], 'doc.pdf'));
      newMissionData.append('studentId', 'student2');
      newMissionData.append('tutorId', 'tutor2');
      newMissionData.append('remuneration', '200');
      newMissionData.append('commissionedById', 'commissioner2');
      newMissionData.append('dateCompleted', new Date().toISOString());


      service.createMission(newMissionData).subscribe(mission => {
        expect(mission).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/missions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newMissionData);
      req.flush({ ...newMissionData, _id: 'newMissionId' });
    });
  });

  describe('updateMission', () => {
    it('should send a PATCH request to the /missions/:id endpoint', () => {
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
    it('should send a PATCH request to the /missions/:id/status endpoint', () => {
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
    it('should send a DELETE request to the /missions/:id endpoint', () => {
      const missionId = 'mission1';
      service.deleteMission(missionId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null); // A successful delete often returns no body
    });
  });
});