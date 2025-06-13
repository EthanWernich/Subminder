import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Subscription {
  id?: string;
  user_id?: string;
  name: string;
  cost: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  first_charge_date: string;
  notes?: string;
  receipt_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient('https://xuobvbyyghehffqrlkfq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b2J2Ynl5Z2hlaGZmcXJsa2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTU1NzksImV4cCI6MjA2NDg5MTU3OX0.Q6BD-PR5CaSb3-92impbTGPetxsK4N_ZxFraIG4xs9k');
  }

  // Auth methods
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  // Subscription CRUD
  async getSubscriptions(user_id: string) {
    return this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('first_charge_date', { ascending: true });
  }

  async getSubscriptionById(id: string) {
    return this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();
  }

  async addSubscription(subscription: Subscription) {
    return this.supabase
      .from('subscriptions')
      .insert([subscription]);
  }

  async updateSubscription(id: string, subscription: Partial<Subscription>) {
    return this.supabase
      .from('subscriptions')
      .update(subscription)
      .eq('id', id);
  }

  async deleteSubscription(id: string) {
    return this.supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
  }
}
