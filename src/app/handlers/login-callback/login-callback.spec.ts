import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { LoginCallback } from './login-callback';
import { provideRouter } from '@angular/router';

describe('LoginCallback', () => {
  let component: LoginCallback;
  let fixture: ComponentFixture<LoginCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginCallback],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginCallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
