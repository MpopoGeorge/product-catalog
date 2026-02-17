import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryTreeNode } from '../../models/category.interface';

@Component({
  selector: 'category-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node">
      <div class="tree-node-name">{{ node.name }}</div>
      <div *ngIf="node.description" class="tree-node-description">{{ node.description }}</div>
      <div *ngIf="node.children && node.children.length > 0" class="tree-node-children">
        <category-tree-node *ngFor="let child of node.children" [node]="child"></category-tree-node>
      </div>
    </div>
  `,
  styles: [`
    .tree-node {
      margin-left: 20px;
      margin-top: 10px;
      padding: 8px;
      border-left: 2px solid #e0e0e0;
      transition: background-color 0.2s;
    }

    .tree-node:hover {
      background-color: #f8f9fa;
      border-left-color: #007bff;
    }

    .tree-node-name {
      font-weight: 600;
      color: #007bff;
      margin-bottom: 4px;
    }

    .tree-node-description {
      font-size: 0.875em;
      color: #666;
      margin-bottom: 8px;
    }

    .tree-node-children {
      margin-left: 20px;
      margin-top: 8px;
    }
  `]
})
export class CategoryTreeNodeComponent {
  @Input() node!: CategoryTreeNode;
}
