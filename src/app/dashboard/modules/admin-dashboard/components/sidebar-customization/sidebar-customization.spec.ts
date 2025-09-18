import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SidebarCustomization } from './sidebar-customization';

describe('SidebarCustomization', () => {
  let component: SidebarCustomization;
  let fixture: ComponentFixture<SidebarCustomization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarCustomization],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarCustomization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
