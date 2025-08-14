import { Component } from '@angular/core';
import { ProfileDropdown } from '../shared/components/profile-dropdown/profile-dropdown';

@Component({
  selector: 'app-login',
  imports: [ProfileDropdown],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

}
