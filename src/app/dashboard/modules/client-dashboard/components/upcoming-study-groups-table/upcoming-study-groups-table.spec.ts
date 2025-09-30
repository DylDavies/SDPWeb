import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { UpcomingStudyGroupsTable } from './upcoming-study-groups-table';
import { StudyGroupService } from '../../../../../services/study-group-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IStudyGroup } from '../../../../../models/interfaces/IStudyGroup.interface';

// Fully compliant mock data
const mockStudyGroups: IStudyGroup[] = [
  {
    id: 'sg1', name: 'Calculus I', description: 'A study group for first-year calculus.', creatorId: 'user-001', max_members: 20, is_private: false, invite_code: 'CALC101', status: 'Scheduled', faculty: 'Mathematics', course: 'MATH101', year_of_study: 'First Year', created_at: new Date('2025-09-15T10:00:00Z').toISOString(), updated_at: new Date('2025-09-15T11:00:00Z').toISOString(), scheduled_start: new Date('2025-10-01T10:00:00Z').toISOString(), scheduled_end: new Date('2025-10-01T12:00:00Z').toISOString(), meeting_times: [], is_scheduled: true,
  },
  {
    id: 'sg2', name: 'Intro to Physics', description: 'A group for introductory mechanics.', creatorId: 'user-002', max_members: 15, is_private: true, invite_code: 'PHYSICS', status: 'Scheduled', faculty: 'Science', course: 'PHYS101', year_of_study: 'First Year', created_at: new Date('2025-09-16T14:00:00Z').toISOString(), updated_at: new Date('2025-09-16T15:00:00Z').toISOString(), scheduled_start: new Date('2025-10-02T14:00:00Z').toISOString(), scheduled_end: new Date('2025-10-02T16:00:00Z').toISOString(), meeting_times: [], is_scheduled: true,
  },
];


describe('UpcomingStudyGroupsTable', () => {
  let component: UpcomingStudyGroupsTable;
  let fixture: ComponentFixture<UpcomingStudyGroupsTable>;
  let mockStudyGroupService: jasmine.SpyObj<StudyGroupService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  beforeEach(async () => {
    mockStudyGroupService = jasmine.createSpyObj('StudyGroupService', ['getUpcomingStudyGroups']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError']);
    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    mockStudyGroupService.getUpcomingStudyGroups.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ UpcomingStudyGroupsTable, NoopAnimationsModule, MatTableModule, MatSortModule ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyGroupService, useValue: mockStudyGroupService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingStudyGroupsTable);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Data Fetching', () => {
    it('should fetch upcoming study groups and populate the data source', fakeAsync(() => {
      mockStudyGroupService.getUpcomingStudyGroups.and.returnValue(of(mockStudyGroups));
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.dataSource.data.length).toBe(2);
      expect(component.dataSource.data[0].name).toBe('Calculus I');
    }));

    it('should handle errors and show a snackbar', fakeAsync(() => {
      mockStudyGroupService.getUpcomingStudyGroups.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.dataSource.data.length).toBe(0);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Could not load upcoming study groups. Please try again later.');
    }));
  });

  describe('User Interactions', () => {
    beforeEach(fakeAsync(() => {
      mockStudyGroupService.getUpcomingStudyGroups.and.returnValue(of(mockStudyGroups));
      fixture.detectChanges();
      tick();
    }));

    it('should apply a filter to the data source', () => {
      const event = { target: { value: 'calculus' } } as unknown as Event;
      component.applyFilter(event);
      expect(component.dataSource.filter).toBe('calculus');
      expect(component.dataSource.filteredData.length).toBe(1);
    });

    it('should announce when sorting is applied', () => {
      component.announceSortChange({ active: 'name', direction: 'asc' });
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Sorted ascending');
    });

    it('should announce when sorting is cleared', () => {
      component.announceSortChange({ active: 'name', direction: '' });
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Sorting cleared');
    });
  });


});