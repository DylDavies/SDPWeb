import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-profile-dropdown',
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    RouterModule
  ],
  templateUrl: './profile-dropdown.html',
  styleUrl: './profile-dropdown.scss'
})
export class ProfileDropdown {
  private router = inject(Router);

  // onSettingsClick(){
  //   //console.log("Navigate user to settings page");
  // }

  onLogoutClick(){
    this.router.navigate(["/logout"]);
  }
}
