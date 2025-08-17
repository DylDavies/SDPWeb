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
  @Input() title = 'Title';
  @Input() subtitle = 'subtitle';
  @Input() imageUrl = 'https://material.angular.dev/assets/img/examples/shiba2.jpg';
  @Input() imageAlt ='Picture of a dog';
  @Input() avatarUrl = 'https://material.angular.dev/assets/img/examples/shiba1.jpg';
  @Input() content = `
    actural content
  `;
  @Input() actions: CardAction[] = [];
}
