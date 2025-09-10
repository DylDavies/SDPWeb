import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeManagement } from './badge-management';

describe('BadgeManagement', () => {
  let component: BadgeManagement;
  let fixture: ComponentFixture<BadgeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});