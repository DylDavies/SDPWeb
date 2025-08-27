import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccountPending } from './account-pending';

describe('AccountPending', () => {
  let component: AccountPending;
  let fixture: ComponentFixture<AccountPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountPending],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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
