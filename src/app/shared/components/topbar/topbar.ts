import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import { ProfileDropdown } from '../profile-dropdown/profile-dropdown';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { AuthService } from '../../../services/auth-service';
import { UserRolePipe } from '../../../pipes/userrole-pipe';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common'; 

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, ProfileDropdown, UserRolePipe, AsyncPipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  public currentUser$: Observable<IUser | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }
}
