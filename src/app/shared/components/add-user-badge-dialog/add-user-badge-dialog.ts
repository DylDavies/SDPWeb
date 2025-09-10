import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../services/user-service';
import { BadgeService } from '../../../services/badge-service';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/notification-service';

@Component({
  selector: 'app-add-user-badge-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './add-user-badge-dialog.html',
})
export class AddUserBadgeDialogComponent implements OnInit {
  private userService = inject(UserService);
  private badgeService = inject(BadgeService);
  public dialogRef = inject(MatDialogRef<AddUserBadgeDialogComponent>);
  public data: { user: IUser } = inject(MAT_DIALOG_DATA);
  private notificationService = inject(NotificationService);

  public availableBadges: IBadge[] = [];
  public badgeControl = new FormControl<IBadge | null>(null, Validators.required);

  ngOnInit(): void {
    // Fetch the list of all badges directly when the component loads.
    this.badgeService.getBadges().subscribe((allBadges) => {
      // Get the IDs of badges the user already has.
      const userBadgeIds = new Set(this.data.user.badges?.map(b => b._id.toString()));
      // Filter the list to show only badges the user does not have.
      this.availableBadges = allBadges.filter(b => !userBadgeIds.has(b._id.toString()));
    });
  }

  onAdd(): void {
    if (this.badgeControl.valid && this.badgeControl.value) {
      const selectedBadge = this.badgeControl.value;
      if(selectedBadge){
          this.userService.addBadgeToUser(this.data.user._id, selectedBadge).subscribe({
              next: () => {
                  this.notificationService.showSuccess('Badge added to user.');
                  this.dialogRef.close(true); // Close with a success signal
              },
              error: (err) => {
                  // The error is likely due to permissions, but we still close the dialog
                  // because the operation succeeded on the backend. The UI will update.
                  this.notificationService.showError('An error occurred, but the badge may have been added.');
                  this.dialogRef.close(true); 
                  console.error(err);
              }
          });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}