import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionListComponent } from '../subscriptions/subscription-list/subscription-list.component';
import { SubscriptionFormComponent } from '../subscriptions/subscription-form/subscription-form.component';
import { Subscription, SupabaseService } from '../core/supabase.service';

interface MonthlySpend {
  month: string;
  amount: number;
}

interface DashboardAnalytics {
  totalMonthlySpend: number;
  totalSubscriptions: number;
  averageSubscriptionCost: number;
  nextPaymentDate: Date | null;
  monthlySpendHistory: MonthlySpend[];
  subscriptions: Subscription[];
  currency: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SubscriptionListComponent, SubscriptionFormComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  activeTab: 'overview' | 'subscriptions' = 'overview';
  showModal = false;
  editingSubscription: Subscription | null = null;
  analytics: DashboardAnalytics = {
    totalMonthlySpend: 0,
    totalSubscriptions: 0,
    averageSubscriptionCost: 0,
    nextPaymentDate: null,
    monthlySpendHistory: [],
    subscriptions: [],
    currency: 'USD'
  };
  loading = true;
  error: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Set initial tab based on query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'subscriptions') {
        this.activeTab = 'subscriptions';
      }
    });

    await this.loadAnalytics();
  }

  async loadAnalytics() {
    this.loading = true;
    this.error = null;
    try {
      const { data: { user } } = await this.supabase.getCurrentUser();
      if (!user) {
        this.error = 'User not logged in.';
        return;
      }

      const { data: subscriptions, error } = await this.supabase.getSubscriptions(user.id);
      if (error) throw error;

      if (subscriptions) {
        this.analytics.subscriptions = subscriptions;
        this.analytics.totalSubscriptions = subscriptions.length;

        // Calculate total monthly spend
        this.analytics.totalMonthlySpend = subscriptions.reduce((total, sub) => {
          const monthlyCost = this.calculateMonthlyCost(sub);
          return total + monthlyCost;
        }, 0);

        // Calculate average subscription cost
        this.analytics.averageSubscriptionCost = this.analytics.totalMonthlySpend /
          (this.analytics.totalSubscriptions || 1);

        // Find next payment date
        const today = new Date();
        const futurePayments = subscriptions
          .map(sub => this.getNextPaymentDate(sub))
          .filter(date => date > today)
          .sort((a, b) => a.getTime() - b.getTime());

        this.analytics.nextPaymentDate = futurePayments[0] || null;

        // Calculate monthly spend history
        this.analytics.monthlySpendHistory = this.calculateMonthlySpendHistory(subscriptions);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      this.loading = false;
    }
  }

  private calculateMonthlyCost(subscription: Subscription): number {
    const cost = subscription.cost || 0;
    switch (subscription.billing_cycle?.toLowerCase()) {
      case 'monthly':
        return cost;
      case 'yearly':
        return cost / 12;
      case 'weekly':
        return cost * 4;
      case 'daily':
        return cost * 30;
      default:
        return cost;
    }
  }

  getNextPaymentDate(subscription: Subscription): Date {
    const firstCharge = new Date(subscription.first_charge_date || '');
    const today = new Date();
    let nextPayment = new Date(firstCharge);

    while (nextPayment <= today) {
      switch (subscription.billing_cycle?.toLowerCase()) {
        case 'monthly':
          nextPayment.setMonth(nextPayment.getMonth() + 1);
          break;
        case 'yearly':
          nextPayment.setFullYear(nextPayment.getFullYear() + 1);
          break;
        case 'weekly':
          nextPayment.setDate(nextPayment.getDate() + 7);
          break;
        case 'daily':
          nextPayment.setDate(nextPayment.getDate() + 1);
          break;
        default:
          return nextPayment;
      }
    }
    return nextPayment;
  }

  private calculateMonthlySpendHistory(subscriptions: Subscription[]): MonthlySpend[] {
    const months: MonthlySpend[] = [];
    const today = new Date();

    // Generate last 6 months instead of 12
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short' });

      // Calculate total spend for this month
      const monthlySpend = subscriptions.reduce((total, sub) => {
        const firstCharge = new Date(sub.first_charge_date || '');
        if (firstCharge <= date) {
          return total + this.calculateMonthlyCost(sub);
        }
        return total;
      }, 0);

      months.push({
        month: monthStr,
        amount: monthlySpend
      });
    }

    return months;
  }

  setTab(tab: 'overview' | 'subscriptions') {
    this.activeTab = tab;
  }

  openAddModal() {
    this.editingSubscription = null;
    this.showModal = true;
  }

  openEditModal(subscription: Subscription) {
    this.editingSubscription = subscription;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingSubscription = null;
  }

  async onSubscriptionSaved() {
    await this.loadAnalytics();
    this.closeModal();
  }
}
