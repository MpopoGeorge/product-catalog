import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, AsyncPipe],
  template: `
    @if (isLoggedIn$ | async) {
      <div class="container">
        <header class="app-header">
          <h1 class="app-title">Product Catalog Management System</h1>
          <nav class="app-nav" role="navigation" aria-label="Main navigation">
            <a 
              routerLink="/products" 
              routerLinkActive="active"
              class="nav-link"
              aria-label="View products">
              Products
            </a>
            <a 
              routerLink="/categories" 
              routerLinkActive="active"
              class="nav-link"
              aria-label="View categories">
              Categories
            </a>
            @if (auth.currentUser | async; as user) {
              <span class="user-info" aria-label="Current user">{{ user.username }}</span>
              <button 
                type="button"
                (click)="logout()" 
                class="nav-link nav-button"
                aria-label="Logout">
                Logout
              </button>
            }
          </nav>
        </header>
        <main role="main">
          <router-outlet></router-outlet>
        </main>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .app-header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .app-title {
      color: #007bff;
      margin: 0 0 20px 0;
    }

    .app-nav {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .nav-link {
      text-decoration: none;
      color: #007bff;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: #f0f0f0;
    }

    .nav-link.active {
      background-color: #007bff;
      color: white;
    }

    .nav-link:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .nav-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
    }

    .user-info {
      color: #333;
      font-weight: 500;
      margin-left: auto;
    }

    @media (max-width: 768px) {
      .app-nav {
        flex-direction: column;
        align-items: flex-start;
      }

      .user-info {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Product Catalog';
  isLoggedIn$ = this.auth.currentUser.pipe(
    map(user => !!user),
    startWith(false)
  );

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Let the router guards handle navigation
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
