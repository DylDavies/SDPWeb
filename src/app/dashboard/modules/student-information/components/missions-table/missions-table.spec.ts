import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionsTable } from './missions-table';

describe('MissionsTable', () => {
  let component: MissionsTable;
  let fixture: ComponentFixture<MissionsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
