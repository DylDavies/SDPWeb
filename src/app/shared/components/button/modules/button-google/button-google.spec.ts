import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonGoogle } from './button-google';

describe('ButtonGoogle', () => {
  let component: ButtonGoogle;
  let fixture: ComponentFixture<ButtonGoogle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGoogle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonGoogle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
