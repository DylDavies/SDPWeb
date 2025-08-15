import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
//import {UserService} 

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  userType: string = 'Admin';     // dynamic user type
  userName: string = 'John Doe';

  //constructor(private userService: UserService) {
    //this.userType = this.userService.getUserType();
    //this.userName = this.userService.getUserName();
  //}
}
