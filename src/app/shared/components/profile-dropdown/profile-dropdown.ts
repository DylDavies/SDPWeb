import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme-service';

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
export class ProfileDropdown implements OnInit{
  private router = inject(Router);
  public themeService = inject(ThemeService);

  public theme: 'light' | 'dark' | null = null;

  ngOnInit(): void {
    this.themeService.themeObs.subscribe((theme) => {
      this.theme = theme;
    });
  }

  onLogoutClick(){
    this.router.navigateByUrl("/logout");
  }
}
