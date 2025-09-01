import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IBundle } from '../../../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

import { EditBundleModal } from './edit-bundle-modal';

describe('EditBundleModal', () => {
  let component: EditBundleModal;
  let fixture: ComponentFixture<EditBundleModal>;

  const mockBundleData: IBundle = {
    _id: 'bundle123',
    student: { _id: 'student123', displayName: 'Test Student' },
    subjects: [],
    creator: 'creator123',
    status: EBundleStatus.Pending,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBundleModal, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: mockBundleData }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBundleModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});