import { Component, OnInit, inject } from '@angular/core';
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

  public availableBadges: IBadge[] = [];
  public badgeControl = new FormControl<IBadge | null>(null, Validators.required);

  ngOnInit(): void {
    // fetch all badges
    this.badgeService.getBadges().subscribe((allBadges) => { 
      const userBadgeIds = new Set(this.data.user.badges?.map(b => b._id.toString()));
      this.availableBadges = allBadges.filter(b => !userBadgeIds.has(b._id.toString())); // filter out badges user already has
    });
  }

  onAdd(): void {
    if (this.badgeControl.valid && this.badgeControl.value) {
      const selectedBadge = this.badgeControl.value;
      if(selectedBadge){
          this.userService.addBadgeToUser(this.data.user._id, selectedBadge).subscribe({
              next: (updatedUser) => {
                  this.dialogRef.close({ updatedUser: updatedUser });
              },
              error: (err) => {
                  this.dialogRef.close({ error: true }); 
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