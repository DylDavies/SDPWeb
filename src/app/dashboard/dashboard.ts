import { Component } from '@angular/core';
import { Sidebar } from "../shared/components/sidebar/sidebar";
import { Topbar } from '../shared/components/topbar/topbar';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar ,Topbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

}
