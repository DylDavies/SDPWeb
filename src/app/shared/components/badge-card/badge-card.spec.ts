import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeCardComponent } from './badge-card';

describe('BadgeCard', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeCardComponent);
    component = fixture.componentInstance;
    component.badge = { _id: '1', name: 'Test', TLA: 'TST', image: 'star', summary: 'summary', description: 'desc', permanent: true, bonus: 0 };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});