import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentManagement } from './student-management';
import { BundleService } from '../../../services/bundle-service';
import { NotificationService } from '../../../services/notification-service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IBundle } from '../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';

describe('StudentManagement', () => {
  let component: StudentManagement;
  let fixture: ComponentFixture<StudentManagement>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockBundles: IBundle[] = [
    { _id: 'b1', student: { _id: 's1', displayName: 'Student A' }, subjects: [], creator: 'c1', status: EBundleStatus.Approved, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'b2', student: { _id: 's2', displayName: 'Student B' }, subjects: [], creator: 'c1', status: EBundleStatus.Pending, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(async () => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [StudentManagement, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load bundles on init', () => {
    bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(2);
    expect(bundleServiceSpy.getBundles).toHaveBeenCalled();
  });

  it('should handle error on load bundles', () => {
    bundleServiceSpy.getBundles.and.returnValue(throwError(() => new Error('Error')));
    fixture.detectChanges();
    expect(notificationServiceSpy.showError).toHaveBeenCalled();
  });

  it('should apply filter to data source', () => {
    const event = { target: { value: 'Student A' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('student a');
  });

  it('should navigate to student info page', () => {
    component.viewStudentInfo(mockBundles[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/student-info', 'b1']);
  });
});