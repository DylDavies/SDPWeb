import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ManageUserRolesDialog } from './manage-user-roles';

describe('ManageUserRolesDialog', () => {
  let component: ManageUserRolesDialog;
  let fixture: ComponentFixture<ManageUserRolesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageUserRolesDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {
            targetUser: { _id: 'user123', roles: [] },
            currentUser: { _id: 'admin456', roles: [] }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUserRolesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
