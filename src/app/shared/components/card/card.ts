import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { CardAction } from '../../../models/interfaces/ICardAction.Interface';


@Component({
  selector: 'app-card',
  standalone: true, // ask about this shit, allegedly makes it easier, won't need to be declared in declerations array of ngmodule
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.scss'],
})
export class Card {
  @Input() title: string = 'Title';
  @Input() subtitle: string = 'subtitle';
  @Input() imageUrl: string = 'https://material.angular.dev/assets/img/examples/shiba2.jpg';
  @Input() imageAlt: string ='Picture of a dog';
  @Input() avatarUrl: string = 'https://material.angular.dev/assets/img/examples/shiba1.jpg';
  @Input() content: string = `
    actural content
  `;
  @Input() actions: CardAction[] = [];
}
