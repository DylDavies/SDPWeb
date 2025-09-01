import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ThemeToggleButton } from './theme-toggle-button';

describe('ThemeToggleButton', () => {
  let component: ThemeToggleButton;
  let fixture: ComponentFixture<ThemeToggleButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleButton],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeToggleButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
