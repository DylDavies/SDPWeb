import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountPending } from './account-pending';

describe('AccountPending', () => {
  let component: AccountPending;
  let fixture: ComponentFixture<AccountPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountPending);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
