import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Card } from './card';

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display custom title and subtitle', () => {
    component.title = 'Custom Title';
    component.subtitle = 'Custom Subtitle';
    fixture.detectChanges();

    expect(component.title).toBe('Custom Title');
    expect(component.subtitle).toBe('Custom Subtitle');
  });

  it('should handle empty actions array', () => {
    component.actions = [];
    fixture.detectChanges();

    expect(component.actions).toEqual([]);
  });

  it('should handle actions array with items', () => {
    const mockActions = [
      { text: 'Test Action', onClick: () => {} }
    ];
    component.actions = mockActions;
    fixture.detectChanges();

    expect(component.actions).toEqual(mockActions);
  });

  it('should display image when imageUrl is provided', () => {
    component.imageUrl = 'test-image.jpg';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const imageElement = compiled.querySelector('img');
    expect(imageElement).toBeTruthy();
  });

  it('should not display image when imageUrl is empty', () => {
    component.imageUrl = '';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const imageElement = compiled.querySelector('img');
    expect(imageElement).toBeFalsy();
  });

  it('should not display image when imageUrl is null', () => {
    component.imageUrl = null as any;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const imageElement = compiled.querySelector('img');
    expect(imageElement).toBeFalsy();
  });

  it('should render action buttons when actions are provided', () => {
    const clickSpy = jasmine.createSpy('onClick');
    const mockActions = [
      { text: 'Action 1', onClick: clickSpy },
      { text: 'Action 2', onClick: jasmine.createSpy('onClick2') }
    ];
    component.actions = mockActions;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent.trim()).toBe('Action 1');
    expect(buttons[1].textContent.trim()).toBe('Action 2');

    // Test button click
    buttons[0].click();
    expect(clickSpy).toHaveBeenCalled();
  });
});
