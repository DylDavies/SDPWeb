import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appForbiddenLabel]',
  standalone: true,
  // This tells Angular that this directive provides a validation function
  providers: [{ provide: NG_VALIDATORS, useExisting: ForbiddenLabelValidatorDirective, multi: true }]
})
export class ForbiddenLabelValidatorDirective implements Validator {
  // We'll pass the array of forbidden labels to this input
  @Input('appForbiddenLabel') forbiddenLabels: string[] = [];

  /**
   * This method is called by Angular to validate the form control.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Don't validate if there's no value
    }

    const isForbidden = this.forbiddenLabels.includes(control.value.trim());

    // If the label is forbidden, return an error object. Otherwise, return null.
    return isForbidden ? { forbiddenLabel: { value: control.value } } : null;
  }
}