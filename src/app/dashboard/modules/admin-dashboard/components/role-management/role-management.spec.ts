import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RoleManagement } from './role-management';

describe('RoleManagement', () => {
  let component: RoleManagement;
  let fixture: ComponentFixture<RoleManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
