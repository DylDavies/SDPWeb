import {Component, inject, OnDestroy, OnInit,Input} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import { NotificationService } from '../../../../../services/notification-service';
import { ILeave } from '../../../../../models/interfaces/ILeave.interface';
import { Subscription} from 'rxjs';
import { CommonModule} from '@angular/common';
import { AuthService } from '../../../../../services/auth-service';
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { MatIconModule } from '@angular/material/icon'; 
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { UserService } from '../../../../../services/user-service';
import { ELeave } from '../../../../../models/enums/ELeave.enum';
import { MatDialog } from '@angular/material/dialog';
import { LeaveModal } from '../leave-modal/leave-modal';


@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './leave-management.html',
  styleUrl: './leave-management.scss',
})
export class LeaveManagement implements OnInit, OnDestroy {
  @Input() userId: string | null = null;
   
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  public displayedColumns: string[] = ['number', 'dates', 'approved','actions'];
  public dataSource: ILeave[] = [];
  public isAdmin = false;

  private subscriptions = new Subscription();
  private viewedUser: IUser | null = null;

  ngOnInit(): void {
    const authSub = this.authService.currentUser$.subscribe(loggedInUser => {
      if (loggedInUser) {
        this.isAdmin = loggedInUser.type === 'admin';
      }
    });
    this.subscriptions.add(authSub);

    const targetUserId = this.userId;
    
    if (targetUserId && this.isAdmin) {
        const userSub = this.userService.getUser().subscribe(profileUser => {
            if (profileUser) {
                this.viewedUser = profileUser;
                this.dataSource = profileUser.leave || [];
            }
        });
        this.subscriptions.add(userSub);
    } else {
        const selfSub = this.authService.currentUser$.subscribe(loggedInUser => {
            if (loggedInUser) {
                this.viewedUser = loggedInUser;
                this.dataSource = loggedInUser.leave || [];
            }
        });
        this.subscriptions.add(selfSub);
    }
  }

approveLeave(leave: ILeave): void {
  if (!this.viewedUser || !leave._id) return;

  this.userService
    .updateLeaveStatus(this.viewedUser._id, leave._id, ELeave.Approved) 
    .subscribe({
      next: (updatedUser) => {
        this.dataSource = updatedUser.leave;
        this.notificationService.showSuccess(
          `Leave for ${this.viewedUser?.displayName} approved.`
        );
      },
      error: (err) => {
        console.error('approve error', err);
        this.notificationService.showError('Could not approve leave.');
      },
    });
}

denyLeave(leave: ILeave): void {
  if (!this.viewedUser || !leave._id) return; 

  this.userService
    .updateLeaveStatus(this.viewedUser._id, leave._id, ELeave.Denied) 
    .subscribe({
      next: (updatedUser) => {
        this.dataSource = updatedUser.leave;
        this.notificationService.showSuccess(
          `Leave for ${this.viewedUser?.displayName} denied.`
        );
      },
      error: (err) => {
        console.error('deny error', err);
        this.notificationService.showError('Could not deny leave.');
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  private dialog = inject(MatDialog);

  openLeaveDetails(leave: ILeave): void {
    this.dialog.open(LeaveModal, {
      width: '500px',
      data: {
        leave: leave,          // pass the clicked leave data
        userId: this.viewedUser?._id
      }
    });
  }
}
