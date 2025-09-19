import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing'; 

import { BadgeLibrary } from './badge-library';

describe('BadgeLibrary', () => {
  let component: BadgeLibrary;
  let fixture: ComponentFixture<BadgeLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeLibrary],
      providers: [
        provideHttpClient(), 
        provideHttpClientTesting() 
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});