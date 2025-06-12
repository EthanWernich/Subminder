import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService, Subscription } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
}

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.scss'
})
export class SubscriptionFormComponent implements OnInit {
  @Input() subscription: Subscription | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  name: string = '';
  cost: number = 0;
  billing_cycle: 'monthly' | 'yearly' = 'monthly';
  first_charge_date: string = '';
  currency: string = 'USD';
  loading = false;
  error: string | null = null;
  isEdit = false;

  // Currencies list kept for future use
  private currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabase: SupabaseService
  ) {}

  ngOnInit() {
    if (this.subscription) {
      this.isEdit = true;
      this.name = this.subscription.name;
      this.cost = this.subscription.cost;
      this.billing_cycle = this.subscription.billing_cycle;
      this.first_charge_date = this.subscription.first_charge_date;
      this.currency = this.subscription.currency || 'USD';
    }
  }

  async onSubmit() {
    if (!this.name || !this.cost || !this.billing_cycle || !this.first_charge_date) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const { data: { user } } = await this.supabase.getCurrentUser();
      if (!user) {
        this.error = 'User not logged in';
        return;
      }

      const subscriptionData = {
        name: this.name,
        cost: this.cost,
        billing_cycle: this.billing_cycle,
        first_charge_date: this.first_charge_date,
        currency: this.currency,
        user_id: user.id
      };

      if (this.isEdit && this.subscription?.id) {
        const { error } = await this.supabase.updateSubscription(this.subscription.id, subscriptionData);
        if (error) throw error;
      } else {
        const { error } = await this.supabase.addSubscription(subscriptionData);
        if (error) throw error;
      }

      this.saved.emit();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  getCurrencySymbol(code: string): string {
    return this.currencies.find((c: Currency) => c.code === code)?.symbol || '$';
  }
}
