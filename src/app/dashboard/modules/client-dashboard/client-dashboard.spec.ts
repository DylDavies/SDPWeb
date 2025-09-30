import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ClientDashboard } from './client-dashboard';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';

// Create mock components to isolate the ClientDashboard component
@Component({ selector: 'app-welcome-card', standalone: true, template: '' })
class MockWelcomeCardComponent {}

@Component({ selector: 'app-calendar', standalone: true, template: '' })
class MockCalendarComponent {}

@Component({ selector: 'app-study-group-calendar', standalone: true, template: '' })
class MockStudyGroupCalendarComponent {}


describe('ClientDashboard', () => {
  let component: ClientDashboard;
  let fixture: ComponentFixture<ClientDashboard>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientDashboard],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    // Override the actual components with our mocks
    .overrideComponent(ClientDashboard, {
        set: {
            imports: [MatTabsModule, MatIconModule, MockWelcomeCardComponent, MockCalendarComponent, MockStudyGroupCalendarComponent],
        }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the main calendar in the "My Dashboard" tab', async () => {
    // The first tab is selected by default, so we can query directly.
    const calendar = fixture.debugElement.query(By.css('app-calendar'));
    expect(calendar).toBeTruthy();
  });
});

