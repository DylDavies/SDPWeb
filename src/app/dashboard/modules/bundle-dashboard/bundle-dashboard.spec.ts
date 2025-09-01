import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { BundleDashboard } from './bundle-dashboard';
import { BundleService } from '../../../services/bundle-service';
import { NotificationService } from '../../../services/notification-service';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { IBundle } from '../../../models/interfaces/IBundle.interface';

describe('BundleDashboard', () => {
  let component: BundleDashboard;
  let fixture: ComponentFixture<BundleDashboard>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockBundles: IBundle[] = [
    { _id: '1', student: { _id: 's1', displayName: 'Student A' }, subjects: [], creator: 'c1', status: EBundleStatus.Pending, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: '2', student: { _id: 's2', displayName: 'Student B' }, subjects: [], creator: 'c2', status: EBundleStatus.Approved, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  ];

  beforeEach(async () => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles', 'setBundleActiveStatus', 'setBundleStatus']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [BundleDashboard, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .compileComponents();

    bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));

    fixture = TestBed.createComponent(BundleDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load bundles on init', () => {
    expect(component).toBeTruthy();
    expect(bundleServiceSpy.getBundles).toHaveBeenCalledTimes(1);
    expect(component.dataSource.data.length).toBe(2);
  });

  it('should show an error notification if loading bundles fails', () => {
    bundleServiceSpy.getBundles.and.returnValue(throwError(() => ({ error: { message: 'Failed to load' } })));
    component.loadBundles();
    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Failed to load');
  });

  it('should approve a bundle and show success notification', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    bundleServiceSpy.setBundleStatus.and.returnValue(of(mockBundles[0]));
    component.approveBundle(mockBundles[0]);
    expect(bundleServiceSpy.setBundleStatus).toHaveBeenCalledWith(mockBundles[0]._id, EBundleStatus.Approved);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle approved.');
  });
  
  it('should deny a bundle and show success notification', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    bundleServiceSpy.setBundleStatus.and.returnValue(of(mockBundles[0]));
    component.denyBundle(mockBundles[0]);
    expect(bundleServiceSpy.setBundleStatus).toHaveBeenCalledWith(mockBundles[0]._id, EBundleStatus.Denied);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle denied.');
  });
  
  it('should show an error if denying a bundle fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    bundleServiceSpy.setBundleStatus.and.returnValue(throwError(() => ({ error: { message: 'Error denying' } })));
    component.denyBundle(mockBundles[0]);
    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error denying');
  });

  it('should deactivate a bundle after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    bundleServiceSpy.setBundleActiveStatus.and.returnValue(of(mockBundles[1]));
    component.confirmAndDeactivate(mockBundles[1]);
    expect(bundleServiceSpy.setBundleActiveStatus).toHaveBeenCalledWith(mockBundles[1]._id, false);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
  });
  
  it('should show an error if deactivating a bundle fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    bundleServiceSpy.setBundleActiveStatus.and.returnValue(throwError(() => ({ error: { message: 'Error deactivating' } })));
    component.confirmAndDeactivate(mockBundles[1]);
    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error deactivating');
  });

  it('should apply a filter to the dataSource', () => {
    const event = { target: { value: 'Student A' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('student a');
  });
});