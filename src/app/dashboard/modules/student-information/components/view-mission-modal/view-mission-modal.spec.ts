import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ViewMissionModal } from './view-mission-modal';
import { FileService } from '../../../../../services/file-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';

// --- MOCK DATA ---
const mockDocument: IDocument = {
  _id: 'doc1',
  fileKey: 'a-random-key',
  originalFilename: 'mission_document.pdf',
  contentType: 'application/pdf',
  uploadedBy: 'user1',
  createdAt: new Date(),
};

const mockMission: IMissions = {
  _id: 'mission1',
  bundleId: 'bundle1',
  document: mockDocument,
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

describe('ViewMissionModal', () => {
  let component: ViewMissionModal;
  let fixture: ComponentFixture<ViewMissionModal>;
  let fileServiceSpy: jasmine.SpyObj<FileService>;
  let snackBarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewMissionModal>>;

  const setupTestBed = async (data: any) => {
    fileServiceSpy = jasmine.createSpyObj('FileService', ['getPresignedDownloadUrl']);
    snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewMissionModal, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: FileService, useValue: fileServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMissionModal);
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setupTestBed(mockMission);
    fileServiceSpy.getPresignedDownloadUrl.and.returnValue(of({ url: 'http://signed-url.com' }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load and sanitize PDF url on init', fakeAsync(async () => {
    await setupTestBed(mockMission);
    const mockUrl = 'https://fake-s3-bucket.com/signed-url-for-pdf';
    fileServiceSpy.getPresignedDownloadUrl.and.returnValue(of({ url: mockUrl }));

    fixture.detectChanges(); // ngOnInit is called
    tick(); // Wait for observables to complete

    expect(component.isLoading).toBeFalse();
    expect(component.pdfUrl).not.toBeNull();
    expect(fileServiceSpy.getPresignedDownloadUrl).toHaveBeenCalledWith(mockDocument._id);
  }));
  
  it('should show an error if fetching the presigned URL fails', fakeAsync(async () => {
    await setupTestBed(mockMission);
    fileServiceSpy.getPresignedDownloadUrl.and.returnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.pdfUrl).toBeNull();
    expect(snackBarServiceSpy.showError).toHaveBeenCalledWith('Could not load the mission document.');
  }));

  it('should handle the case where no document is provided in the data', async () => {
    const missionWithoutDoc = { ...mockMission, document: undefined as any };
    await setupTestBed(missionWithoutDoc);

    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.pdfUrl).toBeNull();
    expect(fileServiceSpy.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('should call the dialogRef.close method when close() is called', async () => {
    await setupTestBed(mockMission);
    fileServiceSpy.getPresignedDownloadUrl.and.returnValue(of({ url: 'http://signed-url.com' }));
    fixture.detectChanges();

    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});