import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SupabaseService } from '../../core/supabase.service';

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
  isLoggedIn = false;
  private routerSubscription: Subscription;
  private authListener: any;

  constructor(private router: Router, private supabase: SupabaseService) {
    // Subscribe to router events to update active tab
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveTab(event.url);
    });
  }

  async ngOnInit() {
    this.updateActiveTab(this.router.url);
    const { data: { user } } = await this.supabase.getCurrentUser();
    this.isLoggedIn = !!user;

    // Listen for auth state changes
    this.authListener = this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.isLoggedIn = !!session?.user;
    });
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authListener && typeof this.authListener.subscription?.unsubscribe === 'function') {
      this.authListener.subscription.unsubscribe();
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

  navigateToPricing() {
    // First navigate to home page
    this.router.navigate(['/']).then(() => {
      // After navigation, scroll to pricing section
      setTimeout(() => {
        const pricingElement = document.getElementById('pricing');
        if (pricingElement) {
          pricingElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100); // Small delay to ensure page is loaded
    });
    this.setActiveTab('Pricing');
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

  async handleLogout() {
    await this.supabase.signOut();
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }
}
