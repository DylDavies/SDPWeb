import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeListComponent } from './badge-list';

describe('BadgeList', () => {
  let component: BadgeListComponent;
  let fixture: ComponentFixture<BadgeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});