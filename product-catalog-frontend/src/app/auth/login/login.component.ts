import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2 class="login-title">Login</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" aria-label="Login form">
          <div class="field">
            <label for="username">Username</label>
            <input 
              id="username" 
              type="text" 
              formControlName="username" 
              autocomplete="username"
              aria-required="true"
              [attr.aria-invalid]="form.get('username')?.invalid && form.get('username')?.touched"
              aria-describedby="username-error" />
            @if (form.get('username')?.invalid && form.get('username')?.touched) {
              <span class="error" id="username-error" role="alert">Username is required</span>
            }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password" 
              autocomplete="current-password"
              aria-required="true"
              [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
              aria-describedby="password-error" />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="error" id="password-error" role="alert">Password is required</span>
            }
          </div>
          @if (errorMessage) {
            <div class="error-msg" role="alert" aria-live="polite">{{ errorMessage }}</div>
          }
          <button 
            type="submit" 
            class="login-button"
            [disabled]="form.invalid || loading"
            aria-label="Submit login form">
            <span *ngIf="loading">Logging in...</span>
            <span *ngIf="!loading">Login</span>
          </button>
        </form>
        <p class="hint">Use any username and password (e.g. admin / admin).</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 32px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .login-title {
      margin-top: 0;
      margin-bottom: 24px;
      color: #007bff;
      text-align: center;
    }

    .field {
      margin-bottom: 20px;
    }

    .field label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
    }

    .field input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 14px;
    }

    .field input:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
      border-color: #007bff;
    }

    .error, .error-msg {
      color: #dc3545;
      font-size: 0.875em;
      display: block;
      margin-top: 4px;
    }

    .error-msg {
      margin-bottom: 16px;
      padding: 10px;
      background-color: #f8d7da;
      border-radius: 4px;
      border-left: 4px solid #dc3545;
    }

    .login-button {
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1em;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .login-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .login-button:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .login-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .hint {
      margin-top: 20px;
      font-size: 0.875em;
      color: #666;
      text-align: center;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.nonNullable.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.errorMessage = '';
    this.loading = true;
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/products';
          this.router.navigate([returnUrl]);
        } else {
          this.errorMessage = 'Login failed. Check that the API is running and try again.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Login failed. Check that the API is running and try again.';
      }
    });
  }
}
