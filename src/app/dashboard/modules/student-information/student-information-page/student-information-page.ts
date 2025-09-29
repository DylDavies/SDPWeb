import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { BundleService } from '../../../../services/bundle-service';
import { IBundle, IPopulatedUser } from '../../../../models/interfaces/IBundle.interface';
import { MatTabsModule } from "@angular/material/tabs";
import { MissionsModal } from '../components/missions-modal/missions-modal';
import { MissionsTable } from '../components/missions-table/missions-table';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from '../../../../models/interfaces/IUser.interface';
import { EPermission } from '../../../../models/enums/permission.enum';
import { AuthService } from '../../../../services/auth-service';
import { EventService } from '../../../../services/event-service';
import { MissionService } from '../../../../services/missions-service';
import { IEvent } from '../../../../models/interfaces/IEvent.interface';
import { Observable, switchMap, of, catchError, forkJoin } from 'rxjs';
import { IMissions } from '../../../../models/interfaces/IMissions.interface';

@Component({
  selector: 'app-student-information-page',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, MatCardModule, MatProgressSpinnerModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatListModule, MatTabsModule, MissionsTable],
  templateUrl: './student-information-page.html',
  styleUrl: './student-information-page.scss'
})
export class StudentInformationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bundleService = inject(BundleService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  public bundle: IBundle | null = null;
   private eventService = inject(EventService);
  private missionService = inject(MissionService);
  public tutors: IPopulatedUser[] = [];
  public isLoading = true;
  public bundleNotFound = false;
  public bundleId: string | null = null;
  public canCreateMissions = false;
  public isUpdatingMissions = false;

  ngOnInit(): void {
    
    const bundleId = this.route.snapshot.paramMap.get('id');
    this.canCreateMissions = this.authService.hasPermission(EPermission.MISSIONS_CREATE);

    if (!bundleId) {
      this.bundleNotFound = true;
      this.isLoading = false;
      return;
    }else{
      this.bundleId = bundleId;
    }

    this.bundleService.getBundleById(bundleId).subscribe({
      next: (bundle) => {
        if (bundle) {
          this.bundle = bundle;
          this.getTutorsFromBundle();
        } else {
          this.bundleNotFound = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.bundleNotFound = true;
        this.isLoading = false;
      }
    });
  }
updateAllMissionHours(): void {
  if (!this.bundleId || this.isUpdatingMissions) return;

  this.isUpdatingMissions = true;  

  this.eventService.getEvents().subscribe((events: IEvent[]) => {
    
    const tutorHours = new Map<string, number>();
    
    events.forEach(event => {
      // Check if event belongs to current bundle and is remarked
      if (event.bundle === this.bundleId && event.remarked) {
        const tutorId = typeof event.tutor === 'object' ? (event.tutor as IPopulatedUser)._id : event.tutor as string;
        
        if (tutorId) {
          const eventHours = event.duration / 60;
          // ACCUMULATE hours instead of replacing them
          const currentHours = tutorHours.get(tutorId) || 0;
          tutorHours.set(tutorId, currentHours + eventHours);
        }
      }
    });
    
    this.updateMissionsForTutors(tutorHours);
  });
}

updateMissionsForTutors(tutorHours: Map<string, number>): void {
  const updatePromises:Observable<IMissions | null>[] = [];
  
  tutorHours.forEach((totalHours, tutorId) => {
    if (totalHours >= 0) { 
      const missionUpdate$ = this.missionService.findMissionByBundleAndTutor(this.bundleId!, tutorId)
        .pipe(
          switchMap(mission => {
            if (mission) {
              return this.missionService.updateMissionHours(mission._id, totalHours);
            } else {
              console.warn(`No mission found for bundle ${this.bundleId} and tutor ${tutorId}`);
              return of(null);
            }
          }),
          catchError(error => {
            console.error(`Error updating mission for tutor ${tutorId}:`, error);
            return of(null);
          })
        );
      
      updatePromises.push(missionUpdate$);
    }
  });
  
  if (updatePromises.length > 0) {
    forkJoin(updatePromises).subscribe({
      next: () => {
        this.isUpdatingMissions = false;  
      },
      error: (error) => {
        console.error('Error updating mission hours:', error);
        this.isUpdatingMissions = false;  
      }
    });
  } else {
    console.log('No missions to update');
    this.isUpdatingMissions = false;  
  }
}

getTutorsFromBundle(): void {
  if (!this.bundle) return;
  const tutorMap = new Map<string, IPopulatedUser>();
  
  this.bundle.subjects.forEach(subject => {
    if (typeof subject.tutor === 'object' && subject.tutor._id) {
      tutorMap.set(subject.tutor._id, subject.tutor);
    }
  });
  
  this.tutors = Array.from(tutorMap.values());
  
  if (this.tutors.length > 0) {
    this.updateAllMissionHours();
  }
}
  openCreateDialog(): void {
    if (this.bundle?.student && typeof this.bundle.student === 'object' && this.bundleId) {
      const dialogRef = this.dialog.open(MissionsModal, {
        width: '500px',
        panelClass: 'missions-dialog-container',
        data: {
          student: this.bundle.student as IUser,
          bundleId: this.bundleId 
        }
      });  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
            const currentId = this.bundleId;
            this.bundleId = null;
            setTimeout(() => this.bundleId = currentId, 0);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }
  getDisplayName(user: string | IPopulatedUser): string {
    if (typeof user === 'object' && user.displayName) {
      return user.displayName;
    }
    return 'N/A';
  }

}