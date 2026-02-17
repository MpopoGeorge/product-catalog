import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryTreeNode } from '../../models/category.interface';

@Component({
  selector: 'category-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="margin-left: 20px; margin-top: 10px;">
      <div style="font-weight: bold; color: #007bff;">{{ node.name }}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">{{ node.description }}</div>
      <div *ngIf="node.children && node.children.length > 0" style="margin-left: 20px;">
        <category-tree-node *ngFor="let child of node.children" [node]="child"></category-tree-node>
      </div>
    </div>
  `
})
export class CategoryTreeNodeComponent {
  @Input() node!: CategoryTreeNode;
}
