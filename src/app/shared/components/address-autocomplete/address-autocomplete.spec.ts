import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Validators } from '@angular/forms';
import { AddressAutocompleteComponent } from './address-autocomplete';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AddressAutocompleteComponent', () => {
  let component: AddressAutocompleteComponent;
  let fixture: ComponentFixture<AddressAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddressAutocompleteComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize search control', () => {
    expect(component.searchCtrl).toBeDefined();
  });

  it('should set initial address if provided', () => {
    const mockAddress = {
      formattedAddress: '123 Test St, Test City',
      placeId: 'test-place-id'
    };
    component.initialAddress = mockAddress;
    component.ngOnInit();
    expect(component.searchCtrl.value).toBe(mockAddress.formattedAddress);
  });

  it('should clear address', () => {
    component.searchCtrl.setValue('Test Address');
    component.currentAddress = { formattedAddress: 'Test Address' };
    component.clearAddress();
    expect(component.searchCtrl.value).toBe('');
    expect(component.currentAddress).toBeUndefined();
  });

  it('should return current address', () => {
    const mockAddress = { formattedAddress: 'Test Address' };
    component.currentAddress = mockAddress;
    expect(component.getAddress()).toEqual(mockAddress);
  });

  it('should handle initial address without formattedAddress', () => {
    const mockAddress = { placeId: 'test-id' };
    component.initialAddress = mockAddress;
    component.ngOnInit();
    expect(component.searchCtrl.value).toBe('');
  });

  it('should set validators when required is true', () => {
    component.required = true;
    component.ngOnInit();
    expect(component.searchCtrl.hasValidator(Validators.required)).toBe(true);
  });

  it('should not set validators when required is false', () => {
    component.required = false;
    component.ngOnInit();
    expect(component.searchCtrl.hasValidator(Validators.required)).toBe(false);
  });

  it('should display suggestion description', () => {
    const suggestion = {
      placeId: 'test-id',
      description: 'Test Description',
      mainText: 'Main',
      secondaryText: 'Secondary'
    };
    expect(component.displaySuggestion(suggestion)).toBe('Test Description');
  });

  it('should display empty string for string input', () => {
    expect(component.displaySuggestion('test string')).toBe('test string');
  });

  it('should display empty string for null suggestion', () => {
    expect(component.displaySuggestion(null as any)).toBe('');
  });

  it('should clear current address on input change', () => {
    component.currentAddress = { formattedAddress: 'Test' };
    component.onInputChange();
    expect(component.currentAddress).toBeUndefined();
  });

  it('should not clear address if none exists', () => {
    component.currentAddress = undefined;
    component.onInputChange();
    expect(component.currentAddress).toBeUndefined();
  });
});
