import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { BadgeRequirementDialogComponent } from './badge-requirement-dialog';
import { BadgeService } from '../../../services/badge-service';
import { SnackBarService } from '../../../services/snackbar-service';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IBadgeRequirement } from '../../../models/interfaces/IBadgeRequirement.interface';

// --- MOCK DATA ---
const mockBadge: IBadge = {
  _id: 'badge-abc-123',
  name: 'Test Badge',
  TLA: 'TBG',
  image: 'test.png',
  summary: 'A badge for testing.',
  description: 'This is a test badge.',
  permanent: true,
  bonus: 10,
};

const mockRequirements: IBadgeRequirement = { requirements: 'You must complete task X.' };

describe('BadgeRequirementDialogComponent', () => {
  let component: BadgeRequirementDialogComponent;
  let fixture: ComponentFixture<BadgeRequirementDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<BadgeRequirementDialogComponent>>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  const setupComponent = (data: { badge: IBadge, isEditable: boolean }) => {
    TestBed.configureTestingModule({
      imports: [BadgeRequirementDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: BadgeService, useValue: jasmine.createSpyObj('BadgeService', ['getBadgeRequirements', 'updateBadgeRequirements']) },
        { provide: SnackBarService, useValue: jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']) },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeRequirementDialogComponent);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<BadgeRequirementDialogComponent>>;
    mockBadgeService = TestBed.inject(BadgeService) as jasmine.SpyObj<BadgeService>;
    mockSnackbarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
  };

  describe('View Mode (isEditable: false)', () => {
    beforeEach(() => {
      setupComponent({ badge: mockBadge, isEditable: false });
    });

    it('should create and not initialize a form', () => {
      mockBadgeService.getBadgeRequirements.and.returnValue(of(mockRequirements));
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.form).toBeUndefined();
      expect(component.isLoading).toBeFalse();
    });

    it('should fetch and display requirements on init', () => {
      mockBadgeService.getBadgeRequirements.and.returnValue(of(mockRequirements));
      fixture.detectChanges();
      expect(mockBadgeService.getBadgeRequirements).toHaveBeenCalledWith(mockBadge._id);
      expect(component.requirementsText).toBe(mockRequirements.requirements);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edit Mode (isEditable: true)', () => {
    beforeEach(() => {
      setupComponent({ badge: mockBadge, isEditable: true });
    });

    it('should create and initialize a form', () => {
      mockBadgeService.getBadgeRequirements.and.returnValue(of(mockRequirements));
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.form).toBeDefined();
      expect(component.form.get('requirements')).toBeDefined();
    });

    it('should fetch requirements and patch the form on init', fakeAsync(() => {
      mockBadgeService.getBadgeRequirements.and.returnValue(of(mockRequirements));
      fixture.detectChanges();
      tick();

      expect(mockBadgeService.getBadgeRequirements).toHaveBeenCalledWith(mockBadge._id);
      expect(component.requirementsText).toBe(mockRequirements.requirements);
      expect(component.form.get('requirements')?.value).toBe(mockRequirements.requirements);
      expect(component.isLoading).toBeFalse();
    }));

    describe('onSave', () => {
      beforeEach(fakeAsync(() => {
        mockBadgeService.getBadgeRequirements.and.returnValue(of(mockRequirements));
        fixture.detectChanges();
        tick();
      }));

      it('should call updateBadgeRequirements and close dialog on success', fakeAsync(() => {
        const updatedText = 'These are the new requirements.';
        component.form.get('requirements')?.setValue(updatedText);
        mockBadgeService.updateBadgeRequirements.and.returnValue(of({ requirements: updatedText }));

        component.onSave();
        expect(component.isLoading).toBeTrue();
        
        tick();
        fixture.detectChanges();

        expect(mockBadgeService.updateBadgeRequirements).toHaveBeenCalledWith(mockBadge._id, updatedText);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Requirements updated successfully.');
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      }));

      it('should not call the update service if the form is invalid', () => {
        spyOnProperty(component.form, 'invalid').and.returnValue(true);
        component.onSave();
        expect(mockBadgeService.updateBadgeRequirements).not.toHaveBeenCalled();
      });
    });
  });
});