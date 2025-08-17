import {Component, Input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule,],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {

  // Placeholder for username and usertype
  userType = 'User Type';
  userName = 'John Doe';
}
