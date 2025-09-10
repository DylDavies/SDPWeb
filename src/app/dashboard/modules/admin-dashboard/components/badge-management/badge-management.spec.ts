import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeManagement } from './badge-management';

describe('BadgeManagement', () => {
  let component: BadgeManagement;
  let fixture: ComponentFixture<BadgeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
