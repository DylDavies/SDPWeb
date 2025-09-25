import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewExtraWorkModal } from './view-extra-work-modal';
import { IExtraWork, EExtraWorkStatus } from '../../../../../models/interfaces/IExtraWork.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';

describe('ViewExtraWorkModal', () => {
  let component: ViewExtraWorkModal;
  let fixture: ComponentFixture<ViewExtraWorkModal>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewExtraWorkModal>>;

  const mockExtraWork: IExtraWork = {
    _id: '1',
    userId: { _id: 'u1', displayName: 'Creator User' } as IPopulatedUser,
    studentId: { _id: 's1', displayName: 'Student User' } as IPopulatedUser,
    commissionerId: { _id: 'c1', displayName: 'Commissioner User' } as IPopulatedUser,
    workType: 'Test',
    details: 'Details',
    remuneration: 100,
    dateCompleted: null,
    status: EExtraWorkStatus.InProgress,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewExtraWorkModal, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { item: mockExtraWork, canEdit: true } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewExtraWorkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get the commissioner name', () => {
    expect(component.getCommissionerName()).toBe('Commissioner User');
  });

  it('should get the creator name', () => {
    expect(component.getCreatorName()).toBe('Creator User');
  });

  it('should return "N/A" if user is not populated', () => {
    component.data.item.studentId = 's1';
    expect(component.getStudentName()).toBe('N/A');
  });

  it('should set the selected date', () => {
    const date = new Date();
    component.onDateSelected(date);
    expect(component.selectedDate).toBe(date);
  });

  it('should close the dialog with the selected date on confirm', () => {
    const date = new Date();
    component.selectedDate = date;
    component.onSetCompleteDate();
    expect(mockDialogRef.close).toHaveBeenCalledWith(date);
  });

  it('should not close the dialog if no date is selected', () => {
    component.selectedDate = null;
    component.onSetCompleteDate();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close the dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});