import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-overlay" (click)="onCancel()" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 id="confirm-title">{{ title }}</h3>
          <button type="button" class="modal-close" (click)="onCancel()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()" #cancelBtn>Cancel</button>
          <button type="button" class="btn btn-danger" (click)="onConfirm()" #confirmBtn>{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 90%;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ddd;
    }

    .modal-header h3 {
      margin: 0;
      color: #dc3545;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      line-height: 30px;
    }

    .modal-close:hover {
      color: #000;
    }

    .modal-close:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-body p {
      margin: 0;
      color: #333;
    }

    .modal-footer {
      padding: 15px 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancelled.emit();
    this.isOpen = false;
  }
}
