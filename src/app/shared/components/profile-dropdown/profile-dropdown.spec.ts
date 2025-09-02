import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileDropdown } from './profile-dropdown';

describe('ProfileDropdown', () => {
  let component: ProfileDropdown;
  let fixture: ComponentFixture<ProfileDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDropdown],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
