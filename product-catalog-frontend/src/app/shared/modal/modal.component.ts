import { Component, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen" 
      class="modal-overlay" 
      (click)="close()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      (keydown.escape)="close()"
      tabindex="-1">
      <div class="modal-content" (click)="$event.stopPropagation()" #modalContent>
        <div class="modal-header">
          <h3 id="modal-title">{{ title }}</h3>
          <button 
            type="button" 
            class="modal-close" 
            (click)="close()"
            aria-label="Close dialog"
            #closeButton>&times;</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[footer]"></ng-content>
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
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
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
      color: #007bff;
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
      border-radius: 2px;
    }

    .modal-overlay:focus {
      outline: none;
    }

    .modal-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
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
export class ModalComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() showFooter = true;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('modalContent') modalContent!: ElementRef;
  @ViewChild('closeButton') closeButton!: ElementRef;

  private previousActiveElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.handleOpenChange();
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.modalContent) {
      this.handleOpenChange();
    }
  }

  private handleOpenChange(): void {
    if (this.isOpen) {
      this.trapFocus();
    } else {
      this.restoreFocus();
    }
  }

  close(): void {
    this.restoreFocus();
    this.closeModal.emit();
  }

  private trapFocus(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
    setTimeout(() => {
      const focusableElements = this.modalContent?.nativeElement?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 0);
  }

  private restoreFocus(): void {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }
}
