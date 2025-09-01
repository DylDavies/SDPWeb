import {Component, inject, OnInit} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import { ProfileDropdown } from '../profile-dropdown/profile-dropdown';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { AuthService } from '../../../services/auth-service';
import { UserTypePipe } from '../../../pipes/usertype-pipe';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common'; 
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';
import { ThemeService } from '../../../services/theme-service';

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, ProfileDropdown, UserTypePipe, AsyncPipe, DisplayNamePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar implements OnInit {
  public currentUser$: Observable<IUser | null>;

  private authService = inject(AuthService);
  public themeService = inject(ThemeService);

  public theme: 'light' | 'dark' | null = null;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.themeService.themeObs.subscribe((theme) => {
      this.theme = theme;
    });
  }
}
