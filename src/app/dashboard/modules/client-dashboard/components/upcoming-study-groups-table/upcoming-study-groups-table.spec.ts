import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UpcomingStudyGroupsTable } from './upcoming-study-groups-table';

describe('UpcomingStudyGroupsTable', () => {
  let component: UpcomingStudyGroupsTable;
  let fixture: ComponentFixture<UpcomingStudyGroupsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingStudyGroupsTable],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingStudyGroupsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
