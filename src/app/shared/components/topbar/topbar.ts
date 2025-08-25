import {Component, inject} from '@angular/core';
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

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, ProfileDropdown, UserTypePipe, AsyncPipe, DisplayNamePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  public currentUser$: Observable<IUser | null>;

  private authService = inject(AuthService);

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }
}
