import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionsModal } from './missions-modal';

describe('MissionsModal', () => {
  let component: MissionsModal;
  let fixture: ComponentFixture<MissionsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
