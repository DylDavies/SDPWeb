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
  let dialog: MatDialog;

  const mockBundles: IBundle[] = [
    { _id: '1', student: { _id: 's1', displayName: 'Student A' }, subjects: [], creator: 'c1', status: EBundleStatus.Pending, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: '2', student: { _id: 's2', displayName: 'Student B' }, subjects: [], creator: 'c2', status: EBundleStatus.Approved, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  ];

  beforeEach(async () => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles', 'setBundleActiveStatus', 'setBundleStatus']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    
    await TestBed.configureTestingModule({
      imports: [BundleDashboard, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ]
    })
    .compileComponents();

    bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));

    fixture = TestBed.createComponent(BundleDashboard);
    component = fixture.componentInstance;
    
    dialog = TestBed.inject(MatDialog);
    
    fixture.detectChanges();
  });

  it('should create and load bundles on init', () => {
    expect(component).toBeTruthy();
    expect(bundleServiceSpy.getBundles).toHaveBeenCalledTimes(1);
    expect(component.dataSource.data.length).toBe(2);
  });

  it('should show an error notification if loading bundles fails', () => {
    const errorMessage = 'Failed to load bundles.';
    bundleServiceSpy.getBundles.and.returnValue(throwError(() => ({ error: { message: errorMessage } })));
    component.loadBundles();
    expect(notificationServiceSpy.showError).toHaveBeenCalledWith(errorMessage);
  });

  it('should apply a filter to the dataSource', () => {
    const event = { target: { value: 'Student A' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('student a');
  });
});

