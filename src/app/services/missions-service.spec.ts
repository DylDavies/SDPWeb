import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

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
    documentPath: 'path/to/doc.pdf',
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
    it('should send a POST request to the /missions endpoint', () => {
      const missionData = new FormData();
      missionData.append('document', new File([], 'doc.pdf'));
      missionData.append('studentId', 'student1');
      missionData.append('tutorId', 'tutor1');
      missionData.append('remuneration', '100');
      missionData.append('commissionedById', 'commissioner1');
      missionData.append('dateCompleted', new Date().toISOString());

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
      req.flush(null);
    });
  });

  // New tests for findMissionByBundleAndTutor
  describe('findMissionByBundleAndTutor', () => {
    it('should send a GET request to find a mission by bundle and tutor IDs', () => {
      const bundleId = 'bundle1';
      const tutorId = 'tutor1';

      service.findMissionByBundleAndTutor(bundleId, tutorId).subscribe(mission => {
        expect(mission).toEqual(mockMission);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/find/bundle/${bundleId}/tutor/${tutorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMission);
    });

    it('should return null when no mission is found', () => {
        const bundleId = 'bundle-nonexistent';
        const tutorId = 'tutor-nonexistent';
  
        service.findMissionByBundleAndTutor(bundleId, tutorId).subscribe(mission => {
          expect(mission).toBeNull();
        });
  
        const req = httpMock.expectOne(`${apiUrl}/missions/find/bundle/${bundleId}/tutor/${tutorId}`);
        expect(req.request.method).toBe('GET');
        req.flush(null);
      });
  });

  // New tests for updateMissionHours
  describe('updateMissionHours', () => {
    it('should send a PATCH request to update mission hours', () => {
      const missionId = 'mission1';
      const hoursToAdd = 10;
      const updatedMission = { ...mockMission, hoursCompleted: mockMission.hoursCompleted! + hoursToAdd };

      service.updateMissionHours(missionId, hoursToAdd).subscribe(mission => {
        expect(mission.hoursCompleted).toBe(15);
      });

      const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}/hours`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ hours: hoursToAdd });
      req.flush(updatedMission);
    });

    it('should handle errors, such as 403 Forbidden', () => {
        const missionId = 'mission1';
        const hoursToAdd = 5;
        const errorMessage = 'Permission denied.';
    
        // Spy on console.error to check if it's called
        spyOn(console, 'error');
    
        service.updateMissionHours(missionId, hoursToAdd).subscribe({
          next: () => fail('should have failed with a 403 error'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(403);
            expect(console.error).toHaveBeenCalledWith('Error updating mission hours:', jasmine.any(HttpErrorResponse));
            expect(console.error).toHaveBeenCalledWith('Permission denied. User may not have MISSIONS_EDIT permission.');
          }
        });
    
        const req = httpMock.expectOne(`${apiUrl}/missions/${missionId}/hours`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ message: errorMessage }, { status: 403, statusText: 'Forbidden' });
      });
  });
});
