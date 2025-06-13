import { Component, OnInit, Output, EventEmitter, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService, Subscription } from '../../core/supabase.service';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.scss'
})
export class SubscriptionListComponent implements OnInit, OnChanges {
  @Output() editSubscription = new EventEmitter<Subscription>();
  @Input() reloadTrigger: any;
  subscriptions: Subscription[] = [];
  loading = false;
  error: string | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadSubscriptions();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['reloadTrigger'] && !changes['reloadTrigger'].firstChange) {
      await this.loadSubscriptions();
    }
  }

  async loadSubscriptions() {
    this.loading = true;
    this.error = null;
    const { data: { user } } = await this.supabase.getCurrentUser();
    if (!user) {
      this.error = 'User not logged in.';
      this.loading = false;
      return;
    }
    const { data, error } = await this.supabase.getSubscriptions(user.id);
    if (error) {
      this.error = error.message;
    } else {
      this.subscriptions = data || [];
    }
    this.loading = false;
  }

  async deleteSubscription(id: string) {
    this.loading = true;
    const { error } = await this.supabase.deleteSubscription(id);
    if (error) {
      this.error = error.message;
    } else {
      this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    }
    this.loading = false;
  }

  onEdit(subscription: Subscription) {
    this.editSubscription.emit(subscription);
  }

  getNextPaymentDate(subscription: Subscription): Date {
    const firstCharge = new Date(subscription.first_charge_date || '');
    const today = new Date();
    let nextPayment = new Date(firstCharge);

    // If the first charge is in the future, that's the next payment
    if (nextPayment > today) {
      return nextPayment;
    }

    // If the first charge is today, the next payment should be the next cycle
    if (
      nextPayment.getFullYear() === today.getFullYear() &&
      nextPayment.getMonth() === today.getMonth() &&
      nextPayment.getDate() === today.getDate()
    ) {
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
      return nextPayment;
    }

    // Otherwise, increment until we find the next payment after today
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
}
