import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import { UserService } from '../../../../../services/user-service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../../../services/notification-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Subscription } from 'rxjs';

export interface PeriodicElement {
  dates: string;
  number: number;
  approved: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {number: 1, dates: "2025/08/01 - 2025/08/13", approved: "approved"}
  
];


@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './leave-management.html',
  styleUrl: './leave-management.scss'
})
export class LeaveManagement implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['number', 'dates', 'approved'];
  dataSource = ELEMENT_DATA;

  public currentUser: IUser | null = null;
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userService.getUser  
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }
}
