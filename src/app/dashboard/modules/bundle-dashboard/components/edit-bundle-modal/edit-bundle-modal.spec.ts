import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBundleModal } from './edit-bundle-modal';

describe('EditBundleModal', () => {
  let component: EditBundleModal;
  let fixture: ComponentFixture<EditBundleModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBundleModal]
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
