import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../../services/user-service';
import { IUser } from '../../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-student-information-page',
  imports: [CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule],
  templateUrl: './student-information-page.html',
  styleUrl: './student-information-page.scss'
})
export class StudentInformationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  public student: IUser | null = null;
  public isLoading = true;
  public studentNotFound = false;

  ngOnInit(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) {
      this.studentNotFound = true;
      this.isLoading = false;
      return;
    }

    this.userService.getUserById(studentId).subscribe({
      next: (user) => {
        if (user) {
          this.student = user;
        } else {
          this.studentNotFound = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.studentNotFound = true;
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

}
