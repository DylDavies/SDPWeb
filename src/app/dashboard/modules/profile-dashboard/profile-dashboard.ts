import { Component, inject, OnInit } from '@angular/core';
import { Card } from '../../../shared/components/card/card';
import { CommonModule } from '@angular/common';
import { CardAction } from '../../../models/interfaces/ICardAction.Interface';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [CommonModule,  Card  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss'
})
export class Profile implements OnInit {
  
  public authService = inject(AuthService);
  public user: IUser | null = null;

  profileCardActions: CardAction[] = [];

  ngOnInit(): void {
    // Subscribe to the currentUser observable to get user data
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
      }
    });
  }
}
