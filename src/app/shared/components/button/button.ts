import { Component } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-button',
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class Button {

}
