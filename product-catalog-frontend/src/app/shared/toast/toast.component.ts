import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="toast toast-{{ type }}" role="alert" aria-live="polite">
      <span class="toast-message">{{ message }}</span>
      <button type="button" class="toast-close" (click)="close()" aria-label="Close notification">&times;</button>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 300px;
      max-width: 500px;
      padding: 16px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 3000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      background-color: #d4edda;
      color: #155724;
      border-left: 4px solid #28a745;
    }

    .toast-error {
      background-color: #f8d7da;
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    .toast-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    .toast-warning {
      background-color: #fff3cd;
      color: #856404;
      border-left: 4px solid #ffc107;
    }

    .toast-message {
      flex: 1;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      padding: 0;
      margin-left: 15px;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-close:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
      border-radius: 2px;
    }
  `]
})
export class ToastComponent {
  @Input() message: string | null = null;
  @Input() type: ToastType = 'info';
  @Input() duration: number = 3000;

  close(): void {
    this.message = null;
  }
}
