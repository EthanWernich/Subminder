import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
export class SubscriptionListComponent implements OnInit {
  @Output() editSubscription = new EventEmitter<Subscription>();
  subscriptions: Subscription[] = [];
  loading = false;
  error: string | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadSubscriptions();
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
}
