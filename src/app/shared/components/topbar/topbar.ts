import {Component, Input} from '@angular/core';
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
   @Input() userType: string = 'User Type';
   @Input() userName: string = 'John Doe';
}
