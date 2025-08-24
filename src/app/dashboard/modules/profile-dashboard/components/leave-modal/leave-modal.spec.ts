import { Component } from '@angular/core';

@Component({
  selector: 'app-leave-modal',
  standalone: true,
  imports: [],
  templateUrl: './leave-modal.html',
  styleUrls: ['./leave-modal.scss']
})
export class LeaveModal {

  // Creates an event that the parent component can listen for.
  //@Output() close = new EventEmitter<void>();

  // This is the function that the HTML calls to close the modal.
  // onClose(): void {
  //   this.close.emit(); // This sends the "close" signal to the parent.
  // }
}