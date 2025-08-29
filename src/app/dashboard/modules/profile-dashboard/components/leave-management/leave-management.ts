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
import {animate, state, style, transition, trigger} from '@angular/animations';


@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './leave-management.html',
  styleUrl: './leave-management.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class LeaveManagement implements OnInit, OnDestroy {
  @Input() userId: string | null = null;
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  public displayedColumns: string[] = ['expand', 'dates', 'approved'];
  public dataSource: ILeave[] = [];
  public isAdmin = false;

  public expandedElement: ILeave | null = null;
  private subscriptions = new Subscription();
  private viewedUser: IUser | null = null;

  ngOnInit(): void {
    const authSub = this.authService.currentUser$.subscribe(loggedInUser => {
      if (loggedInUser?.type == 'admin') {
        this.isAdmin = true;
        this.displayedColumns = [...this.displayedColumns, 'actions']
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
      next: (updatedUser: IUser) => {
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
}
