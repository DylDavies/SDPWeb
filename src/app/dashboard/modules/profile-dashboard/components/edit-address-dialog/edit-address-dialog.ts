import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IAddress } from '../../../../../models/interfaces/IAddress.interface';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AddressAutocompleteComponent } from '../../../../../shared/components/address-autocomplete/address-autocomplete';

@Component({
  selector: 'app-edit-address-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule,
    AddressAutocompleteComponent
  ],
  templateUrl: './edit-address-dialog.html',
  styleUrls: ['./edit-address-dialog.scss']
})
export class EditAddressDialog implements AfterViewInit {
  @ViewChild(AddressAutocompleteComponent) addressComponent!: AddressAutocompleteComponent;

  isSaving = false;
  selectedAddress?: IAddress;

  public dialogRef = inject(MatDialogRef<EditAddressDialog>);
  public data: IUser = inject(MAT_DIALOG_DATA);
  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);

  ngAfterViewInit(): void {
    // Small delay to ensure the component is fully initialized
    setTimeout(() => {
      if (this.data.address) {
        this.selectedAddress = this.data.address;
      }
    });
  }

  onAddressSelected(address: IAddress | undefined): void {
    this.selectedAddress = address;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    const updatedData: Partial<IUser> = {
      address: this.selectedAddress
    };

    this.userService.updateProfile(updatedData).subscribe({
      next: (updatedUser) => {
        this.snackbarService.showSuccess('Address updated successfully!');
        this.dialogRef.close(updatedUser);
      },
      error: (err) => {
        this.snackbarService.showError('Failed to update address.');
        console.error(err);
        this.isSaving = false;
      }
    });
  }

  clearAddress(): void {
    this.addressComponent.clearAddress();
    this.selectedAddress = undefined;
  }
}
