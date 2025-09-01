import {Component, inject, OnDestroy, OnInit,Input, ViewChild} from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
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
import { EPermission } from '../../../../../models/enums/permission.enum';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatButtonModule, MatIconModule, MatPaginatorModule],
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
  public dataSource = new MatTableDataSource<ILeave>([]);
  public canManageLeave = this.authService.hasPermission(EPermission.LEAVE_MANAGE);

  public expandedElement: ILeave | null = null;
  private subscriptions = new Subscription();
  public viewedUser: IUser | null = null;
  public loggedInUser: IUser | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  

  ngOnInit(): void {
    const targetUserId = this.userId;
    const authSub = this.authService.currentUser$.subscribe(loggedInUser => {
    this.loggedInUser = loggedInUser;
      if (this.canManageLeave && loggedInUser?._id !== targetUserId) {
        if (!this.displayedColumns.includes('actions')) {
          this.displayedColumns = [...this.displayedColumns, 'actions'];
        }
      }
    });
    this.subscriptions.add(authSub);

    
  
    if (targetUserId) {
      const userSub = this.userService.getUserById(targetUserId).subscribe(profileUser => {
        if (profileUser) {
          this.viewedUser = profileUser;
          this.dataSource.data = profileUser.leave?.slice().sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) || [];
        }
      });
      this.subscriptions.add(userSub);
    } else {
      // fallback to logged-in user
      const selfSub = this.authService.currentUser$.subscribe(loggedInUser => {
        if (loggedInUser) {
          this.viewedUser = loggedInUser;
          this.dataSource.data = loggedInUser.leave?.slice().sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) || [];
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
        this.dataSource.data = updatedUser.leave;
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
        this.dataSource.data = updatedUser.leave;
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
