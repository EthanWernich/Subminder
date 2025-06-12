import { Component } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    this.loading = true;
    this.error = null;
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      this.loading = false;
      return;
    }
    const { error } = await this.supabase.signUp(this.email, this.password);
    this.loading = false;
    if (error) {
      this.error = error.message;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
