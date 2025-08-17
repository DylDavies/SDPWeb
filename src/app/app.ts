import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Topbar } from './shared/components/topbar/topbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('SDPWeb');
}
