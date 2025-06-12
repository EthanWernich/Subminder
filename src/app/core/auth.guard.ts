import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from './supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  const { data: { user } } = await supabase.getCurrentUser();

  if (user) {
    return true;
  }

  // Redirect to login page if not authenticated
  return router.createUrlTree(['/auth/login']);
};
