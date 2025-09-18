import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RoleChipRow } from './role-chip-row';
import { RoleNode } from '../../../services/role-service';

// Mock data for testing
const mockRoles: RoleNode[] = [
  { _id: '1', name: 'Admin', color: 'red', permissions: [], parent: null, children: [] },
  { _id: '2', name: 'Tutor', color: 'blue', permissions: [], parent: '1', children: [] },
  { _id: '3', name: 'Student', color: 'green', permissions: [], parent: '1', children: [] },
  { _id: '4', name: 'Manager', color: 'purple', permissions: [], parent: '1', children: [] },
  { _id: '5', name: 'Auditor', color: 'orange', permissions: [], parent: '1', children: [] },
];

describe('RoleChipRow', () => {
  let component: RoleChipRow;
  let fixture: ComponentFixture<RoleChipRow>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleChipRow, MatChipsModule, MatTooltipModule, NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleChipRow);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Template Rendering', () => {
    it('should display "No roles assigned" when the roles array is empty', () => {
      component.roles = [];
      fixture.detectChanges();
      
      const noRolesSpan = nativeElement.querySelector('.no-roles');
      const chipSet = nativeElement.querySelector('mat-chip-set');

      expect(noRolesSpan).toBeTruthy();
      expect(noRolesSpan?.textContent).toContain('No roles assigned');
      expect(chipSet).toBeFalsy();
    });

    it('should display all roles when the count is less than the limit', () => {
      component.roles = mockRoles.slice(0, 2); // 2 roles
      fixture.detectChanges();

      const chips = nativeElement.querySelectorAll('mat-chip-row');
      
      expect(chips.length).toBe(2);
      expect(chips[0].textContent).toContain('Admin');
      expect(chips[1].textContent).toContain('Tutor');
      expect(nativeElement.querySelector('.more-chip')).toBeFalsy();
    });

    it('should display all roles when the count is equal to the limit', () => {
      component.roles = mockRoles.slice(0, 3); // 3 roles
      fixture.detectChanges();

      const chips = nativeElement.querySelectorAll('mat-chip-row');

      expect(chips.length).toBe(3);
      expect(nativeElement.querySelector('.more-chip')).toBeFalsy();
    });

    it('should display the limit of roles and a "+X more" chip when the count exceeds the limit', () => {
      component.roles = mockRoles; // 5 roles
      fixture.detectChanges();

      const chips = nativeElement.querySelectorAll('mat-chip-row');
      const moreChip = nativeElement.querySelector('.more-chip');

      expect(chips.length).toBe(component.visibleRolesLimit + 1); // 3 visible + 1 more chip
      expect(moreChip).toBeTruthy();
      expect(moreChip?.textContent).toContain(`+${mockRoles.length - component.visibleRolesLimit} more`); // +2 more
    });
  });

  describe('getRemainingRolesTooltip', () => {
    it('should return an empty string if the number of roles is less than or equal to the limit', () => {
      const roles = mockRoles.slice(0, 3);
      const tooltip = component.getRemainingRolesTooltip(roles);
      expect(tooltip).toBe('');
    });

    it('should return a newline-separated string of the remaining role names', () => {
      const roles = mockRoles; // 5 roles
      const expectedTooltip = 'Manager\nAuditor';
      const tooltip = component.getRemainingRolesTooltip(roles);
      expect(tooltip).toBe(expectedTooltip);
    });
  });
});
