import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { BadgeManagement } from './badge-management';
import { BadgeService } from '../../../../../services/badge-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { CreateEditBadgeDialogComponent } from '../create-edit-badge-dialog/create-edit-badge-dialog';

// --- MOCK DATA ---
const mockBadges: IBadge[] = [
  { _id: '1', name: 'Badge One', TLA: 'BOE', image: 'star', summary: 's1', description: 'd1', permanent: true, bonus: 10 },
  { _id: '2', name: 'Badge Two', TLA: 'BTO', image: 'emoji_events', summary: 's2', description: 'd2', permanent: false, bonus: 5 }
];

describe('BadgeManagement', () => {
  let component: BadgeManagement;
  let fixture: ComponentFixture<BadgeManagement>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockBadgeService = jasmine.createSpyObj('BadgeService', ['getBadges']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [BadgeManagement, NoopAnimationsModule],
      providers: [
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and loadBadges', () => {
    it('should call loadBadges on initialization', () => {
      spyOn(component, 'loadBadges').and.callThrough();
      mockBadgeService.getBadges.and.returnValue(of([]));
      fixture.detectChanges(); // triggers ngOnInit
      expect(component.loadBadges).toHaveBeenCalled();
    });

    it('should fetch and assign badges on loadBadges call', () => {
      mockBadgeService.getBadges.and.returnValue(of(mockBadges));
      component.loadBadges();
      expect(component.badges.length).toBe(2);
      expect(component.badges[0].name).toBe('Badge One');
    });

    it('should show an error snackbar if getBadges fails', () => {
      mockBadgeService.getBadges.and.returnValue(throwError(() => new Error('API Error')));
      component.loadBadges();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load badges.');
    });
  });

  describe('openCreateBadgeDialog', () => {
    it('should open the CreateEditBadgeDialogComponent', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);
      component.openCreateBadgeDialog();
      expect(mockDialog.open).toHaveBeenCalledWith(CreateEditBadgeDialogComponent, {
        width: '500px',
      });
    });

    it('should call loadBadges if the dialog is closed with a truthy result', fakeAsync(() => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      spyOn(component, 'loadBadges').and.callThrough();
      mockBadgeService.getBadges.and.returnValue(of([])); // Ensure loadBadges has something to subscribe to
      
      component.openCreateBadgeDialog();
      tick(); // process afterClosed observable
      
      expect(component.loadBadges).toHaveBeenCalled();
    }));

    it('should NOT call loadBadges if the dialog is closed with a falsy result', fakeAsync(() => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);
      spyOn(component, 'loadBadges').and.callThrough();
      
      component.openCreateBadgeDialog();
      tick();
      
      expect(component.loadBadges).not.toHaveBeenCalled();
    }));
  });
});