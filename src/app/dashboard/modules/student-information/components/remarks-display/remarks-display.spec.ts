import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RemarksDisplay } from './remarks-display';
import { RemarkService } from '../../../../../services/remark-service';
import { FileService } from '../../../../../services/file-service';
import { IRemark, IRemarkTemplate } from '../../../../../models/interfaces/IRemark.interface';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RemarksDisplay', () => {
  let component: RemarksDisplay;
  let fixture: ComponentFixture<RemarksDisplay>;
  let remarkServiceSpy: jasmine.SpyObj<RemarkService>;
  let fileServiceSpy: jasmine.SpyObj<FileService>;

  const mockTutor: IPopulatedUser = {
    _id: 'tutor1',
    displayName: 'Test Tutor',
    email: 'tutor@test.com'
  } as IPopulatedUser;

  const mockEvent: IEvent = {
    _id: 'event1',
    bundle: 'bundle1',
    student: mockTutor,
    tutor: mockTutor,
    subject: 'Mathematics',
    startTime: new Date('2023-01-15'),
    duration: 60,
    remarked: true,
    remark: 'remark1'
  };

  const mockDocument: IDocument = {
    _id: 'doc1',
    fileKey: 'key123',
    originalFilename: 'test.pdf',
    contentType: 'application/pdf',
    uploadedBy: 'user1',
    createdAt: new Date()
  };

  const mockTemplate: IRemarkTemplate = {
    _id: 'template1',
    name: 'Test Template',
    fields: [
      { name: 'attendance', type: 'boolean' },
      { name: 'notes', type: 'string' },
      { name: 'document', type: 'pdf' }
    ],
    isActive: true
  };

  const mockRemark1: IRemark = {
    _id: 'remark1',
    event: mockEvent as any, // API populates this as IEvent object
    template: mockTemplate,
    remarkedAt: new Date('2023-01-15'),
    entries: [
      { field: 'attendance', value: true },
      { field: 'notes', value: 'Good progress' },
      { field: 'document', value: mockDocument }
    ]
  };

  const mockRemark2: IRemark = {
    _id: 'remark2',
    event: { ...mockEvent, _id: 'event2', startTime: new Date('2023-01-20') } as any, // API populates this
    template: mockTemplate,
    remarkedAt: new Date('2023-01-20'),
    entries: [
      { field: 'attendance', value: false },
      { field: 'notes', value: 'Needs improvement' }
    ]
  };

  beforeEach(async () => {
    remarkServiceSpy = jasmine.createSpyObj('RemarkService', ['getRemarksForStudent']);
    fileServiceSpy = jasmine.createSpyObj('FileService', ['getPresignedDownloadUrl']);

    await TestBed.configureTestingModule({
      imports: [RemarksDisplay, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RemarkService, useValue: remarkServiceSpy },
        { provide: FileService, useValue: fileServiceSpy },
        MatDialog
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RemarksDisplay);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should load remarks when studentId changes to a valid value', () => {
      spyOn(component, 'loadRemarks');
      component.ngOnChanges({
        studentId: {
          currentValue: 'student1',
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.loadRemarks).toHaveBeenCalled();
    });

    it('should not load remarks when studentId changes to null', () => {
      spyOn(component, 'loadRemarks');
      component.ngOnChanges({
        studentId: {
          currentValue: null,
          previousValue: 'student1',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.loadRemarks).not.toHaveBeenCalled();
    });
  });

  describe('loadRemarks', () => {
    it('should load and sort remarks for a valid studentId', () => {
      component.studentId = 'student1';
      remarkServiceSpy.getRemarksForStudent.and.returnValue(of([mockRemark1, mockRemark2]));

      component.loadRemarks();

      expect(component.isLoading).toBeFalse();
      expect(component.sortedRemarks.length).toBe(2);
      expect(remarkServiceSpy.getRemarksForStudent).toHaveBeenCalledWith('student1');
    });

    it('should not load remarks when studentId is null', () => {
      component.studentId = null;
      component.loadRemarks();
      expect(remarkServiceSpy.getRemarksForStudent).not.toHaveBeenCalled();
    });
  });

  describe('sortRemarksChronologically', () => {
    it('should sort remarks by date (most recent first)', () => {
      const sorted = component.sortRemarksChronologically([mockRemark1, mockRemark2]);
      expect(sorted[0]._id).toBe('remark2'); // Jan 20 before Jan 15
    });

    it('should handle remarks with null dates', () => {
      const remarkWithNullDate: IRemark = {
        ...mockRemark1,
        _id: 'remark3',
        event: { ...mockEvent, startTime: undefined } as any
      };
      const sorted = component.sortRemarksChronologically([mockRemark1, remarkWithNullDate]);
      expect(sorted).toBeTruthy();
    });
  });

  describe('getTutorName', () => {
    it('should return tutor display name when event is populated', () => {
      expect(component.getTutorName(mockRemark1)).toBe('Test Tutor');
    });

    it('should return "Unknown Tutor" when tutor is null', () => {
      const remarkWithoutTutor: IRemark = {
        ...mockRemark1,
        event: { ...mockEvent, tutor: null } as any
      };
      expect(component.getTutorName(remarkWithoutTutor)).toBe('Unknown Tutor');
    });

    it('should return "Unknown Tutor" when event is not an object', () => {
      const remarkWithStringEvent: IRemark = {
        ...mockRemark1,
        event: 'event-id' as any
      };
      expect(component.getTutorName(remarkWithStringEvent)).toBe('Unknown Tutor');
    });
  });

  describe('getSubject', () => {
    it('should return subject when event is populated', () => {
      expect(component.getSubject(mockRemark1)).toBe('Mathematics');
    });

    it('should return "Unknown Subject" when subject is null', () => {
      const remarkWithoutSubject: IRemark = {
        ...mockRemark1,
        event: { ...mockEvent, subject: null } as any
      };
      expect(component.getSubject(remarkWithoutSubject)).toBe('Unknown Subject');
    });

    it('should return "Unknown Subject" when event is not an object', () => {
      const remarkWithStringEvent: IRemark = {
        ...mockRemark1,
        event: 'event-id' as any
      };
      expect(component.getSubject(remarkWithStringEvent)).toBe('Unknown Subject');
    });
  });

  describe('getRemarkValue', () => {
    it('should return value when entry is found', () => {
      expect(component.getRemarkValue(mockRemark1, 'attendance')).toBe(true);
    });

    it('should return "N/A" when entry is not found', () => {
      expect(component.getRemarkValue(mockRemark1, 'nonexistent')).toBe('N/A');
    });
  });

  describe('formatValue', () => {
    it('should return "N/A" for null', () => {
      expect(component.formatValue(null, 'text')).toBe('N/A');
    });

    it('should return "N/A" for undefined', () => {
      expect(component.formatValue(undefined as any, 'text')).toBe('N/A');
    });

    it('should return "Yes" for true boolean', () => {
      expect(component.formatValue(true, 'boolean')).toBe('Yes');
    });

    it('should return "No" for false boolean', () => {
      expect(component.formatValue(false, 'boolean')).toBe('No');
    });

    it('should return filename for document object', () => {
      expect(component.formatValue(mockDocument, 'pdf')).toBe('test.pdf');
    });

    it('should return string representation for other values', () => {
      expect(component.formatValue('test', 'text')).toBe('test');
      expect(component.formatValue(123, 'number')).toBe('123');
    });
  });

  describe('getEventDate', () => {
    it('should return date when event has startTime', () => {
      const date = component.getEventDate(mockRemark1);
      expect(date).toEqual(new Date('2023-01-15'));
    });

    it('should return null when startTime is null', () => {
      const remarkWithNullDate: IRemark = {
        ...mockRemark1,
        event: { ...mockEvent, startTime: null } as any
      };
      expect(component.getEventDate(remarkWithNullDate)).toBeNull();
    });

    it('should return null when event is not an object', () => {
      const remarkWithStringEvent: IRemark = {
        ...mockRemark1,
        event: 'event-id' as any
      };
      expect(component.getEventDate(remarkWithStringEvent)).toBeNull();
    });
  });

  describe('toggleRemark', () => {
    it('should add remark to expanded set when not expanded', () => {
      component.toggleRemark('remark1');
      expect(component.expandedRemarks.has('remark1')).toBeTrue();
    });

    it('should remove remark from expanded set when already expanded', () => {
      component.expandedRemarks.add('remark1');
      component.toggleRemark('remark1');
      expect(component.expandedRemarks.has('remark1')).toBeFalse();
    });
  });

  describe('isExpanded', () => {
    it('should return true when remark is expanded', () => {
      component.expandedRemarks.add('remark1');
      expect(component.isExpanded('remark1')).toBeTrue();
    });

    it('should return false when remark is not expanded', () => {
      expect(component.isExpanded('remark1')).toBeFalse();
    });
  });

  describe('isFileField', () => {
    it('should return true for pdf', () => {
      expect(component.isFileField('pdf')).toBeTrue();
    });

    it('should return true for image', () => {
      expect(component.isFileField('image')).toBeTrue();
    });

    it('should return true for audio', () => {
      expect(component.isFileField('audio')).toBeTrue();
    });

    it('should return false for other types', () => {
      expect(component.isFileField('text')).toBeFalse();
    });
  });

  describe('isDocument', () => {
    it('should return true for valid document', () => {
      expect(component.isDocument(mockDocument)).toBeTrue();
    });

    it('should return false for null', () => {
      expect(component.isDocument(null)).toBeFalse();
    });

    it('should return false for undefined', () => {
      expect(component.isDocument(undefined)).toBeFalse();
    });

    it('should return false for non-object', () => {
      expect(component.isDocument('string')).toBeFalse();
    });

    it('should return false for object without _id', () => {
      expect(component.isDocument({ fileKey: 'key' })).toBeFalse();
    });
  });

  describe('getDocument', () => {
    it('should return document when value is a valid document', () => {
      expect(component.getDocument(mockDocument)).toEqual(mockDocument);
    });

    it('should return null when value is not a document', () => {
      expect(component.getDocument('string')).toBeNull();
    });
  });

  describe('downloadFile', () => {
    it('should open download URL on success', () => {
      spyOn(window, 'open');
      fileServiceSpy.getPresignedDownloadUrl.and.returnValue(of({ url: 'http://test.com/file' }));

      component.downloadFile(mockDocument);

      expect(fileServiceSpy.getPresignedDownloadUrl).toHaveBeenCalledWith('doc1');
      expect(window.open).toHaveBeenCalledWith('http://test.com/file', '_blank');
    });

    it('should log error on failure', () => {
      spyOn(console, 'error');
      fileServiceSpy.getPresignedDownloadUrl.and.returnValue(throwError(() => new Error('Download failed')));

      component.downloadFile(mockDocument);

      expect(console.error).toHaveBeenCalledWith('Failed to download file:', jasmine.any(Error));
    });
  });

  describe('isImageFile', () => {
    it('should return true for image/* content types', () => {
      const imageDoc = { ...mockDocument, contentType: 'image/png' };
      expect(component.isImageFile(imageDoc)).toBeTrue();
    });

    it('should return false for non-image content types', () => {
      expect(component.isImageFile(mockDocument)).toBeFalse();
    });
  });

  describe('isAudioFile', () => {
    it('should return true for audio/* content types', () => {
      const audioDoc = { ...mockDocument, contentType: 'audio/mp3' };
      expect(component.isAudioFile(audioDoc)).toBeTrue();
    });

    it('should return false for non-audio content types', () => {
      expect(component.isAudioFile(mockDocument)).toBeFalse();
    });
  });

  describe('isPdfFile', () => {
    it('should return true for application/pdf', () => {
      expect(component.isPdfFile(mockDocument)).toBeTrue();
    });

    it('should return false for non-PDF content types', () => {
      const imageDoc = { ...mockDocument, contentType: 'image/png' };
      expect(component.isPdfFile(imageDoc)).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      spyOn(component['subscriptions'], 'unsubscribe');
      component.ngOnDestroy();
      expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
  });
});
