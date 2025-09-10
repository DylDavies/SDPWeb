import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BadgeDetailDialogComponent } from './badge-detail-dialog';

describe('BadgeDetailDialog', () => {
  let component: BadgeDetailDialogComponent;
  let fixture: ComponentFixture<BadgeDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeDetailDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { badge: {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});