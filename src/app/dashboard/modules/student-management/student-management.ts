import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsTable } from './components/students-table/students-table';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, StudentsTable],
  templateUrl: './student-management.html',
  styleUrl: './student-management.scss'
})
export class StudentManagement {
}