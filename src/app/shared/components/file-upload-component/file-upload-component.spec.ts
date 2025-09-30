import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SnackBarService } from '../../../services/snackbar-service';
import { FileUploadComponent } from './file-upload-component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showError']);

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent, NoopAnimationsModule],
      providers: [
        { provide: SnackBarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('File Validation', () => {
    it('should show an error if the file is too large', () => {
      const largeFile = new File([''], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      component.onFileSelected({
        currentTarget: { files: [largeFile] },
      } as unknown as Event);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'File is too large. Maximum size is 10MB.'
      );
    });

    it('should show an error for an invalid file type', () => {
      const invalidFile = new File([''], 'invalid.txt', { type: 'text/plain' });
      component.onFileSelected({
        currentTarget: { files: [invalidFile] },
      } as unknown as Event);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Invalid file type. Please select a valid file.'
      );
    });

    it('should accept a valid file', () => {
      const validFile = new File([''], 'valid.pdf', { type: 'application/pdf' });
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected({
        currentTarget: { files: [validFile] },
      } as unknown as Event);

      expect(component.selectedFile).toBe(validFile);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(validFile);
    });
  });

  describe('Upload Logic', () => {
    it('should emit the uploadTriggered event and simulate progress', fakeAsync(() => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      component.selectedFile = file;
      spyOn(component.uploadTriggered, 'emit');

      component.triggerUpload();
      expect(component.isUploading).toBeTrue();

      tick(200);
      expect(component.uploadProgress).toBe(10);

      tick(1800);
      expect(component.uploadProgress).toBe(100);
      expect(component.isUploading).toBeFalse();
      expect(component.uploadTriggered.emit).toHaveBeenCalledWith(file);
    }));
  });

  it('should clear the selected file', () => {
    component.selectedFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    component.clearSelection();
    expect(component.selectedFile).toBeNull();
  });
});