import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UserTable } from './user-table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UserTable', () => {
  let component: UserTable;
  let fixture: ComponentFixture<UserTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTable, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});