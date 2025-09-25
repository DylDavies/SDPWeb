import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewExtraWorkModal } from './view-extra-work-modal';

describe('ViewExtraWorkModal', () => {
  let component: ViewExtraWorkModal;
  let fixture: ComponentFixture<ViewExtraWorkModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewExtraWorkModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewExtraWorkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
