import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBundleModal } from './create-bundle-modal';

describe('CreateBundleModal', () => {
  let component: CreateBundleModal;
  let fixture: ComponentFixture<CreateBundleModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBundleModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBundleModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
