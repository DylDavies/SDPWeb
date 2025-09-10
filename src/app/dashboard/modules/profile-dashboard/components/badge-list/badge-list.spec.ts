import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeList } from './badge-list';

describe('BadgeList', () => {
  let component: BadgeList;
  let fixture: ComponentFixture<BadgeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
