import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <div class="container">
      <header style="margin-bottom: 30px;">
        <h1>Product Catalog Management System</h1>
        <nav style="margin-top: 20px;">
          <a routerLink="/products" style="margin-right: 15px; text-decoration: none; color: #007bff;">Products</a>
          <a routerLink="/categories" style="margin-right: 15px; text-decoration: none; color: #007bff;">Categories</a>
        </nav>
      </header>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
    }
    h1 {
      color: #007bff;
    }
  `]
})
export class AppComponent {
  title = 'Product Catalog';
}
