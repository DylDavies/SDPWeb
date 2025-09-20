import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionsTable } from './missions-table';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MissionsTable', () => {
  let component: MissionsTable;
  let fixture: ComponentFixture<MissionsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsTable],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        
      ]
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
