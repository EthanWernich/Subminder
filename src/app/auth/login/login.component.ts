import { Component } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    this.loading = true;
    this.error = null;
    const { error } = await this.supabase.signIn(this.email, this.password);
    this.loading = false;
    if (error) {
      this.error = error.message;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
