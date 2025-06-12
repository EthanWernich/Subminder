import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

interface NavItem {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  activeTab = 'Home';
  navItems: NavItem[] = [
    { name: 'Home', url: '/', icon: 'home' },
    { name: 'Subscriptions', url: '/dashboard', icon: 'credit-card' },
    { name: 'Pricing', url: '/#pricing', icon: 'dollar-sign' },
  ];

  private routerSubscription: Subscription;

  constructor(private router: Router) {
    // Subscribe to router events to update active tab
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveTab(event.url);
    });
  }

  ngOnInit() {
    // Set initial active tab based on current route
    this.updateActiveTab(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateActiveTab(url: string) {
    // Handle root path
    if (url === '/') {
      this.activeTab = 'Home';
      return;
    }

    // Handle dashboard path
    if (url.startsWith('/dashboard')) {
      this.activeTab = 'Subscriptions';
      return;
    }

    // Handle pricing anchor
    if (url.includes('#pricing')) {
      this.activeTab = 'Pricing';
      return;
    }

    // Default to Home if no match
    this.activeTab = 'Home';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getIcon(name: string): string {
    switch (name) {
      case 'Home':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      case 'Subscriptions':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
      case 'Pricing':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
      default:
        return '';
    }
  }
}
