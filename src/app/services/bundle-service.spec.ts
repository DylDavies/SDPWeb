import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BundleService } from './bundle-service';
import { HttpService } from './http-service';
import { EBundleStatus } from '../models/enums/bundle-status.enum';
import { IBundle, IBundleSubject } from '../models/interfaces/IBundle.interface';

describe('BundleService', () => {
  let service: BundleService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;

  const mockBundle: IBundle = {
    _id: 'bundle-123',
    student: 'student-456',
    createdBy: 'creator-789',
    subjects: [
      { _id: 'subject-1', subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
    ],
    status: EBundleStatus.Pending,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockBundles: IBundle[] = [
    mockBundle,
    {
      _id: 'bundle-456',
      student: 'student-789',
      createdBy: 'creator-101',
      subjects: [
        { _id: 'subject-2', subject: 'science-456', grade: '11', tutor: 'tutor-456', durationMinutes: 180 }
      ],
      status: EBundleStatus.Approved,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockSubject: Partial<IBundleSubject> = {
    subject: 'english-789',
    grade: '12',
    tutor: 'tutor-789',
    durationMinutes: 240
  };

  beforeEach(() => {
    httpServiceSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        BundleService,
        { provide: HttpService, useValue: httpServiceSpy }
      ]
    });
    service = TestBed.inject(BundleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBundles', () => {
    it('should retrieve all bundles from the backend', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockBundles));

      service.getBundles().subscribe((bundles) => {
        expect(bundles).toEqual(mockBundles);
        expect(bundles.length).toBe(2);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('bundle');
        done();
      });
    });

    it('should return empty array when no bundles exist', (done) => {
      httpServiceSpy.get.and.returnValue(of([]));

      service.getBundles().subscribe((bundles) => {
        expect(bundles).toEqual([]);
        expect(bundles.length).toBe(0);
        done();
      });
    });
  });

  describe('getBundleById', () => {
    it('should retrieve a specific bundle by ID', (done) => {
      const bundleId = 'bundle-123';
      httpServiceSpy.get.and.returnValue(of(mockBundle));

      service.getBundleById(bundleId).subscribe((bundle) => {
        expect(bundle).toEqual(mockBundle);
        expect(bundle._id).toBe(bundleId);
        expect(httpServiceSpy.get).toHaveBeenCalledWith(`bundle/${bundleId}`);
        done();
      });
    });
  });

  describe('createBundle', () => {
    it('should create a new bundle with student ID and subjects', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects).subscribe((bundle) => {
        expect(bundle).toEqual(mockBundle);
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects
        });
        done();
      });
    });

    it('should create a bundle with multiple subjects', (done) => {
      const studentId = 'student-789';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 },
        { subject: 'science-456', grade: '11', tutor: 'tutor-456', durationMinutes: 180 }
      ];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects
        });
        done();
      });
    });

    it('should create a bundle with empty subjects array', (done) => {
      const studentId = 'student-101';
      const subjects: Partial<IBundleSubject>[] = [];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: []
        });
        done();
      });
    });

    it('should create a bundle with lessonLocation', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const lessonLocation = {
        streetAddress: '101 Library Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        formattedAddress: '101 Library Street, New York, NY 10001, USA'
      };
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, lessonLocation).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          lessonLocation: lessonLocation
        });
        done();
      });
    });

    it('should create a bundle with manager', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const managerId = 'manager-123';
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, undefined, managerId).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          manager: managerId
        });
        done();
      });
    });

    it('should create a bundle with stakeholders', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const stakeholderIds = ['stakeholder-1', 'stakeholder-2'];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, undefined, undefined, stakeholderIds).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          stakeholders: stakeholderIds
        });
        done();
      });
    });

    it('should create a bundle with all optional fields', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const lessonLocation = {
        streetAddress: 'Online',
        city: 'Virtual',
        formattedAddress: 'Online - Virtual'
      };
      const managerId = 'manager-123';
      const stakeholderIds = ['stakeholder-1'];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, lessonLocation, managerId, stakeholderIds).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          lessonLocation: lessonLocation,
          manager: managerId,
          stakeholders: stakeholderIds
        });
        done();
      });
    });
  });

  describe('updateBundle', () => {
    it('should update an existing bundle with new data', (done) => {
      const bundleId = 'bundle-123';
      const updateData: Partial<IBundle> = {
        status: EBundleStatus.Approved,
        isActive: true
      };
      const updatedBundle = { ...mockBundle, ...updateData };
      httpServiceSpy.patch.and.returnValue(of(updatedBundle));

      service.updateBundle(bundleId, updateData).subscribe((bundle) => {
        expect(bundle.status).toBe(EBundleStatus.Approved);
        expect(bundle.isActive).toBe(true);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`bundle/${bundleId}`, updateData);
        done();
      });
    });

    it('should update bundle status only', (done) => {
      const bundleId = 'bundle-456';
      const updateData: Partial<IBundle> = { status: EBundleStatus.Denied };
      httpServiceSpy.patch.and.returnValue(of(mockBundle));

      service.updateBundle(bundleId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`bundle/${bundleId}`, updateData);
        done();
      });
    });

    it('should update bundle with lessonLocation', (done) => {
      const bundleId = 'bundle-123';
      const updateData: Partial<IBundle> = {
        lessonLocation: {
          streetAddress: '200 New Street',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'USA',
          formattedAddress: '200 New Street, Boston, MA 02101, USA'
        }
      };
      httpServiceSpy.patch.and.returnValue(of(mockBundle));

      service.updateBundle(bundleId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`bundle/${bundleId}`, updateData);
        done();
      });
    });

    it('should update bundle with manager', (done) => {
      const bundleId = 'bundle-123';
      const updateData: Partial<IBundle> = { manager: 'manager-456' };
      httpServiceSpy.patch.and.returnValue(of(mockBundle));

      service.updateBundle(bundleId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`bundle/${bundleId}`, updateData);
        done();
      });
    });

    it('should update bundle with stakeholders', (done) => {
      const bundleId = 'bundle-123';
      const updateData: Partial<IBundle> = { stakeholders: ['stakeholder-1', 'stakeholder-2'] };
      httpServiceSpy.patch.and.returnValue(of(mockBundle));

      service.updateBundle(bundleId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`bundle/${bundleId}`, updateData);
        done();
      });
    });
  });

  describe('addSubjectToBundle', () => {
    it('should add a new subject to an existing bundle', (done) => {
      const bundleId = 'bundle-123';
      const newSubject: Partial<IBundleSubject> = mockSubject;
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.addSubjectToBundle(bundleId, newSubject).subscribe((bundle) => {
        expect(bundle).toEqual(mockBundle);
        expect(httpServiceSpy.post).toHaveBeenCalledWith(
          `bundle/${bundleId}/subjects`,
          newSubject
        );
        done();
      });
    });

    it('should add subject with all properties', (done) => {
      const bundleId = 'bundle-456';
      const fullSubject: Partial<IBundleSubject> = {
        subject: 'history-101',
        grade: '9',
        tutor: 'tutor-101',
        durationMinutes: 60
      };
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.addSubjectToBundle(bundleId, fullSubject).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith(
          `bundle/${bundleId}/subjects`,
          fullSubject
        );
        done();
      });
    });
  });

  describe('removeSubjectFromBundle', () => {
    it('should remove a subject from a bundle', (done) => {
      const bundleId = 'bundle-123';
      const subjectId = 'subject-1';
      httpServiceSpy.delete.and.returnValue(of(mockBundle));

      service.removeSubjectFromBundle(bundleId, subjectId).subscribe((bundle) => {
        expect(bundle).toEqual(mockBundle);
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(
          `bundle/${bundleId}/subjects/${subjectId}`
        );
        done();
      });
    });

    it('should handle removing multiple subjects one by one', (done) => {
      const bundleId = 'bundle-456';
      const subjectId1 = 'subject-1';
      const subjectId2 = 'subject-2';
      httpServiceSpy.delete.and.returnValue(of(mockBundle));

      service.removeSubjectFromBundle(bundleId, subjectId1).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(
          `bundle/${bundleId}/subjects/${subjectId1}`
        );

        service.removeSubjectFromBundle(bundleId, subjectId2).subscribe(() => {
          expect(httpServiceSpy.delete).toHaveBeenCalledWith(
            `bundle/${bundleId}/subjects/${subjectId2}`
          );
          done();
        });
      });
    });
  });

  describe('setBundleActiveStatus', () => {
    it('should set bundle active status to true', (done) => {
      const bundleId = 'bundle-123';
      const activeBundle = { ...mockBundle, isActive: true };
      httpServiceSpy.patch.and.returnValue(of(activeBundle));

      service.setBundleActiveStatus(bundleId, true).subscribe((bundle) => {
        expect(bundle.isActive).toBe(true);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `bundle/${bundleId}/status/active`,
          { isActive: true }
        );
        done();
      });
    });

    it('should set bundle active status to false', (done) => {
      const bundleId = 'bundle-123';
      const inactiveBundle = { ...mockBundle, isActive: false };
      httpServiceSpy.patch.and.returnValue(of(inactiveBundle));

      service.setBundleActiveStatus(bundleId, false).subscribe((bundle) => {
        expect(bundle.isActive).toBe(false);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `bundle/${bundleId}/status/active`,
          { isActive: false }
        );
        done();
      });
    });
  });

  describe('setBundleStatus', () => {
    it('should set bundle status to APPROVED', (done) => {
      const bundleId = 'bundle-123';
      const approvedBundle = { ...mockBundle, status: EBundleStatus.Approved };
      httpServiceSpy.patch.and.returnValue(of(approvedBundle));

      service.setBundleStatus(bundleId, EBundleStatus.Approved).subscribe((bundle) => {
        expect(bundle.status).toBe(EBundleStatus.Approved);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `bundle/${bundleId}/status`,
          { status: EBundleStatus.Approved }
        );
        done();
      });
    });

    it('should set bundle status to REJECTED', (done) => {
      const bundleId = 'bundle-456';
      const rejectedBundle = { ...mockBundle, status: EBundleStatus.Denied };
      httpServiceSpy.patch.and.returnValue(of(rejectedBundle));

      service.setBundleStatus(bundleId, EBundleStatus.Denied).subscribe((bundle) => {
        expect(bundle.status).toBe(EBundleStatus.Denied);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `bundle/${bundleId}/status`,
          { status: EBundleStatus.Denied }
        );
        done();
      });
    });

    it('should set bundle status to PENDING', (done) => {
      const bundleId = 'bundle-789';
      const pendingBundle = { ...mockBundle, status: EBundleStatus.Pending };
      httpServiceSpy.patch.and.returnValue(of(pendingBundle));

      service.setBundleStatus(bundleId, EBundleStatus.Pending).subscribe((bundle) => {
        expect(bundle.status).toBe(EBundleStatus.Pending);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `bundle/${bundleId}/status`,
          { status: EBundleStatus.Pending }
        );
        done();
      });
    });
  });

  describe('createBundle - additional edge cases', () => {
    it('should create bundle without optional lessonLocation', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, undefined, undefined, undefined).subscribe((bundle) => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects
        });
        done();
      });
    });

    it('should create bundle with only managerId', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const managerId = 'manager-999';
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, undefined, managerId, undefined).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          manager: managerId
        });
        done();
      });
    });

    it('should create bundle with only stakeholderIds', (done) => {
      const studentId = 'student-456';
      const subjects: Partial<IBundleSubject>[] = [
        { subject: 'math-123', grade: '10', tutor: 'tutor-123', durationMinutes: 120 }
      ];
      const stakeholderIds = ['stakeholder-1'];
      httpServiceSpy.post.and.returnValue(of(mockBundle));

      service.createBundle(studentId, subjects, undefined, undefined, stakeholderIds).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('bundle', {
          student: studentId,
          subjects: subjects,
          stakeholders: stakeholderIds
        });
        done();
      });
    });
  });
});