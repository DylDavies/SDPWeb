import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ViewMissionModal } from './view-mission-modal';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MissionService } from '../../../../../services/missions-service';
import { NotificationService } from '../../../../../services/notification-service';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';

describe('ViewMissionModal', () => {
  let component: ViewMissionModal;
  let fixture: ComponentFixture<ViewMissionModal>;
  let missionServiceSpy: jasmine.SpyObj<MissionService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockMission: IMissions = {
    _id: 'mission1',
    bundleId: 'bundle1',
    documentPath: 'path/to/doc.pdf',
    documentName: 'Test Mission Document',
    student: 'student1',
    tutor: 'tutor1',
    createdAt: new Date(),
    remuneration: 100,
    commissionedBy: 'commissioner1',
    hoursCompleted: 10,
    dateCompleted: new Date(),
    status: EMissionStatus.Active,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    missionServiceSpy = jasmine.createSpyObj('MissionService', ['downloadMissionDocument']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);

    await TestBed.configureTestingModule({
      imports: [ViewMissionModal, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: mockMission },
        { provide: MissionService, useValue: missionServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMissionModal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and sanitize PDF url on init', fakeAsync(() => {
    const blob = new Blob([''], { type: 'application/pdf' });
    missionServiceSpy.downloadMissionDocument.and.returnValue(of(blob));
    fixture.detectChanges();
    tick();
    expect(component.pdfUrl).toBeDefined();
    expect(missionServiceSpy.downloadMissionDocument).toHaveBeenCalledWith('doc.pdf');
  }));

  it('should call download service on download button click', () => {
    const blob = new Blob([''], { type: 'application/pdf' });
    missionServiceSpy.downloadMissionDocument.and.returnValue(of(blob));
    component.downloadDocument();
    expect(missionServiceSpy.downloadMissionDocument).toHaveBeenCalledWith('doc.pdf');
  });
});