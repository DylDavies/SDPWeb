import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccountDisabled } from './account-disabled';

describe('AccountDisabled', () => {
  let component: AccountDisabled;
  let fixture: ComponentFixture<AccountDisabled>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDisabled],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountDisabled);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
