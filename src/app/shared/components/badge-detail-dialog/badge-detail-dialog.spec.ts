import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeDetailDialog } from './badge-detail-dialog';

describe('BadgeDetailDialog', () => {
  let component: BadgeDetailDialog;
  let fixture: ComponentFixture<BadgeDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
