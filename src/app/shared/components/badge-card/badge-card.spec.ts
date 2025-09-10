import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeCard } from './badge-card';

describe('BadgeCard', () => {
  let component: BadgeCard;
  let fixture: ComponentFixture<BadgeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
