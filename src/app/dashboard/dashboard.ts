import { Component } from '@angular/core';
import { Sidebar } from "../shared/components/sidebar/sidebar";

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

}
