import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMissionModal } from './view-mission-modal';

describe('ViewMissionModal', () => {
  let component: ViewMissionModal;
  let fixture: ComponentFixture<ViewMissionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMissionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewMissionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
