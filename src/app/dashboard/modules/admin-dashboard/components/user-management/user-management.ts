import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { UserService } from '../../../../../services/user-service';
import { UserTable } from '../../../../../shared/components/user-table/user-table';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    UserTable
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit, OnDestroy {
  private userService = inject(UserService);

  public users: IUser[] = [];
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.allUsers$.subscribe(users => {
        this.users = users;
      })
    );
    
    this.userService.fetchAllUsers().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}