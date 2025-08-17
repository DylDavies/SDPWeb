import { Component } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-button-google',
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './button-google.html',
  styleUrl: './button-google.scss'
})
export class ButtonGoogle {

}
