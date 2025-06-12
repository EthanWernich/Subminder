import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DisplayCard {
  icon: string; // emoji or SVG for now
  title: string;
  description: string;
  date: string;
  iconClass?: string;
  titleClass?: string;
  className?: string;
}

@Component({
  selector: 'app-display-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-cards.component.html',
  styleUrl: './display-cards.component.scss'
})
export class DisplayCardsComponent {
  @Input() cards: DisplayCard[] = [
    {
      icon: '🍏',
      title: 'Apple Subscription',
      description: 'iCloud+ 200GB, Family Plan',
      date: 'Renewal: 5th June',
      iconClass: 'icon-apple',
      titleClass: 'text-apple',
      className: 'card-apple',
    },
    {
      icon: '🎨',
      title: 'Canva Pro',
      description: 'Annual plan, 5 seats',
      date: 'Renewal: 12th Jan',
      iconClass: 'icon-canva',
      titleClass: 'text-canva',
      className: 'card-canva',
    },
    {
      icon: '🎵',
      title: 'Apple Music',
      description: 'Student Plan',
      date: 'Renewal: 1st July',
      iconClass: 'icon-music',
      titleClass: 'text-music',
      className: 'card-music',
    },
  ];
}
