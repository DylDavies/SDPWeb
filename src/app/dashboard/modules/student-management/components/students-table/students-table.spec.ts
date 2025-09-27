import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentsTable } from './students-table';
import { AuthService } from '../../../../../services/auth-service';
import { of } from 'rxjs';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { BundleService } from '../../../../../services/bundle-service';
import { IBundle } from '../../../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { Router } from '@angular/router';

describe('StudentsTable', () => {
  let component: StudentsTable;
  let fixture: ComponentFixture<StudentsTable>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAdminUser: IUser = {
    _id: 'admin1',
    displayName: 'Admin User',
    type: EUserType.Admin,
    email: '',
    googleId: '',
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'system',
    leave: []
  };

  const mockStaffUser: IUser = {
    _id: 'staff1',
    displayName: 'Staff User',
    type: EUserType.Staff,
    email: '',
    googleId: '',
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'system',
    leave: []
  };

  const mockBundles: IBundle[] = [
    // Bundle for staff1
    { _id: 'b1', student: { _id: 's1', displayName: 'Student A' }, subjects: [{ _id: 'sub1', subject: 'Math', grade: '10', tutor: 'staff1', durationMinutes: 10 }], createdBy: 'c1', status: EBundleStatus.Approved, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    // Bundle for another staff member
    { _id: 'b2', student: { _id: 's2', displayName: 'Student B' }, subjects: [{ _id: 'sub2', subject: 'Science', grade: '11', tutor: 'staff2', durationMinutes: 10 }], createdBy: 'c1', status: EBundleStatus.Pending, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];


  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { currentUser$: of(null) });
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [StudentsTable, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StudentsTable);
    component = fixture.componentInstance;
    bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all active students for an Admin user', () => {
    // Reconfigure the spy for this specific test
    Object.defineProperty(authServiceSpy, 'currentUser$', { value: of(mockAdminUser) });
    fixture.detectChanges(); // This triggers ngOnInit

    expect(component.dataSource.data.length).toBe(2);
    
    const student1 = component.dataSource.data[0].student;
    if (typeof student1 === 'object') {
        expect(student1.displayName).toBe('Student A');
    } else {
        fail('student1 should be an object');
    }

    const student2 = component.dataSource.data[1].student;
    if (typeof student2 === 'object') {
        expect(student2.displayName).toBe('Student B');
    } else {
        fail('student2 should be an object');
    }
  });

  it('should show only assigned students for a Staff user', () => {
     // Reconfigure the spy for this specific test
     Object.defineProperty(authServiceSpy, 'currentUser$', { value: of(mockStaffUser) });
     fixture.detectChanges(); // This triggers ngOnInit

     expect(component.dataSource.data.length).toBe(1);
     const student1 = component.dataSource.data[0].student;
     if (typeof student1 === 'object') {
        expect(student1.displayName).toBe('Student A');
     } else {
        fail('student1 should be an object');
     }
  });

  it('should filter students by name', () => {
    Object.defineProperty(authServiceSpy, 'currentUser$', { value: of(mockAdminUser) });
    fixture.detectChanges();

    const event = { target: { value: 'Student B' } } as unknown as Event;
    component.applyFilter(event);

    expect(component.dataSource.filteredData.length).toBe(1);
    const student1 = component.dataSource.filteredData[0].student;
    if(typeof student1 === 'object') {
        expect(student1.displayName).toBe('Student B');
    } else {
        fail('filtered student should be an object');
    }
  });
});


