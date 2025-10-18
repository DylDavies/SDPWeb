import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeCard } from './welcome-card';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { Clipboard } from '@angular/cdk/clipboard';

describe('WelcomeCard', () => {
  let component: WelcomeCard;
  let fixture: ComponentFixture<WelcomeCard>;
  let snackbarService: jasmine.SpyObj<SnackBarService>;
  let clipboard: jasmine.SpyObj<Clipboard>;

  beforeEach(async () => {
    const snackbarSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess']);
    const clipboardSpy = jasmine.createSpyObj('Clipboard', ['copy']);

    await TestBed.configureTestingModule({
      imports: [WelcomeCard],
      providers: [
        provideAnimationsAsync(),
        { provide: SnackBarService, useValue: snackbarSpy },
        { provide: Clipboard, useValue: clipboardSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomeCard);
    component = fixture.componentInstance;
    snackbarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    clipboard = TestBed.inject(Clipboard) as jasmine.SpyObj<Clipboard>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the welcome card when closeWelcomeCard is called', () => {
    expect(component.cardState).toBe('visible');
    component.closeWelcomeCard();
    expect(component.cardState).toBe('hidden');
  });

  it('should copy email to clipboard and show success message when copyEmail is called', () => {
    component.copyEmail();
    expect(clipboard.copy).toHaveBeenCalledWith('support@tutorcore.works');
    expect(snackbarService.showSuccess).toHaveBeenCalledWith('Support email copied to clipboard!');
  });
});
