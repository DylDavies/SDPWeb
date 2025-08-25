import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleChipRow } from './role-chip-row';

describe('RoleChipRow', () => {
  let component: RoleChipRow;
  let fixture: ComponentFixture<RoleChipRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleChipRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleChipRow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
