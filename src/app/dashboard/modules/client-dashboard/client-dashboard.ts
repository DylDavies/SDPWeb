import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { WelcomeCard } from "./components/welcome-card/welcome-card";
import { UserTable } from '../../../shared/components/user-table/user-table';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { UserService } from '../../../services/user-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-dashboard',
  imports: [WelcomeCard, UserTable, CommonModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss'
})
export class ClientDashboard implements OnInit, OnDestroy {
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