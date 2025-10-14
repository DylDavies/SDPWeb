import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ISidebarLinkDefinition, AVAILABLE_SIDEBAR_LINKS, ISidebarRemovable } from '../../../../../config/sidebar-links.config';
import { ISidebarItem } from '../../../../../models/interfaces/ISidebarItem.interface';
import { SidebarService } from '../../../../../services/sidebar-service';
import { EditCategoryDialog } from './components/edit-category-dialog/edit-category-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-sidebar-customization',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './sidebar-customization.html',
  styleUrls: ['./sidebar-customization.scss']
})
export class SidebarCustomization implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private snackbarService = inject(SnackBarService);
  private dialog = inject(MatDialog);

  public availableLinks: ISidebarLinkDefinition[] = [];
  public currentSidebarItems: (ISidebarItem & ISidebarRemovable)[] = [];
  private oldSidebarItems: (ISidebarItem & ISidebarRemovable)[] = [];
  private sidebarSubscription!: Subscription;

  // --- State management for drag & drop ---
  public isDragging = false;
  public draggedNode: ISidebarItem | null = null;
  public dragHoveredNode: ISidebarItem | null = null;
  public dropIntoNode: ISidebarItem | null = null;
  public dropAction: 'on' | 'before' | null = null;

  // --- Using NestedTreeControl for natural indentation ---
  treeControl = new NestedTreeControl<ISidebarItem>(node => node.children);
  dataSource = new MatTreeNestedDataSource<ISidebarItem>();
  hasChild = (node: ISidebarItem) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    this.sidebarSubscription = this.sidebarService.sidebarItems$.subscribe(items => {
      this.currentSidebarItems = JSON.parse(JSON.stringify(items));
      this.currentSidebarItems = this.currentSidebarItems.map(v => {
        const availItem = AVAILABLE_SIDEBAR_LINKS.find(i => i.label == v.label);

        v.stopRemove = availItem?.stopRemove;

        return v;
      });

      this.oldSidebarItems = JSON.parse(JSON.stringify(items));
      this.refreshTree();
      this.updateAvailableLinks();
    });
  }

  ngOnDestroy(): void {
    this.sidebarSubscription?.unsubscribe();
  }

  isExpanded(node: ISidebarItem) {
    const expanded = this.treeControl.isExpanded(node);
    const canBeExpanded = node.children && node.children.length > 0;

    if (!canBeExpanded && expanded) {
      this.treeControl.collapse(node);
      return false;
    }

    return expanded;
  }

  private getUsedRoutes(items: ISidebarItem[]): Set<string> {
    const used = new Set<string>();
    const dive = (nodes: ISidebarItem[]) => {
      for (const node of nodes) {
        if (node.route) used.add(node.route);
        if (node.children) dive(node.children);
      }
    };
    dive(items);
    return used;
  }

  private updateAvailableLinks(): void {
    const usedRoutes = this.getUsedRoutes(this.currentSidebarItems);
    this.availableLinks = AVAILABLE_SIDEBAR_LINKS.filter(link => !usedRoutes.has(link.route!));
  }

  /**
   * Forces the tree to re-render. This is the fix for children not appearing.
   */
  private refreshTree(): void {
    this.dataSource.data = [];
    this.dataSource.data = this.currentSidebarItems;
    if (this.dragHoveredNode) {
        this.treeControl.expand(this.dragHoveredNode);
    }
  }

  addItem(link: ISidebarLinkDefinition): void {
    const newSidebarItem: ISidebarItem = { ...link, order: this.currentSidebarItems.length, children: [] };
    this.currentSidebarItems.push(newSidebarItem);
    this.oldSidebarItems = JSON.parse(JSON.stringify(this.currentSidebarItems));
    this.refreshTree();
    this.updateAvailableLinks();
  }

  /**
   * The definitive drop handler that correctly handles all cases.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drop(event: CdkDragDrop<any>): void {
    const draggedItem = event.item.data as (ISidebarItem & ISidebarRemovable);

    if (this.dropAction === 'on' && this.dragHoveredNode && !this.dragHoveredNode.route && this.draggedNode && this.draggedNode !== this.dragHoveredNode) {
      // --- ACTION: Nesting an item ---
      if (!this.isDescendant(this.dragHoveredNode, this.draggedNode)) {
        this.removeItemFromTree(this.currentSidebarItems, this.draggedNode);
        this.dragHoveredNode.children = this.dragHoveredNode.children || [];
        this.dragHoveredNode.children.push(this.draggedNode);
      }
    } else if (this.dropAction === 'before') {
      if (this.dropIntoNode) {
        this.removeItemFromTree(this.currentSidebarItems, draggedItem);
        this.dropIntoNode.children = this.dropIntoNode.children || [];
        this.dropIntoNode.children.push(draggedItem);
      } else {
      // --- ORIGINAL LOGIC FOR REORDERING ---
        const dropTargetNode = this.dragHoveredNode;
        const parent = dropTargetNode ? this.findParent(this.currentSidebarItems, dropTargetNode) : null;
        const targetList = parent ? parent.children! : this.currentSidebarItems;
        const dropIndex = dropTargetNode ? targetList.indexOf(dropTargetNode) : targetList.length;

        const oldParent = this.findParent(this.oldSidebarItems, draggedItem);
        const oldTargetList = oldParent ? oldParent.children! : this.oldSidebarItems;
        const oldPos = oldTargetList.find(v => v.label == draggedItem.label);
        const oldIndex = oldPos ? oldTargetList.indexOf(oldPos) : null;

        this.removeItemFromTree(this.currentSidebarItems, draggedItem);
        targetList.splice((oldIndex !== null && oldIndex < dropIndex) ? dropIndex - 1 : dropIndex, 0, draggedItem);
      }
    } else if (event.previousContainer !== event.container) {
      if (draggedItem.stopRemove) {
        this.snackbarService.showError("That item must always be in the Sidebar Layout.");
        return;
      }

      // --- ACTION: Moving between lists ---
      if (event.container.id === 'available') {
        this.removeItemFromTree(this.currentSidebarItems, draggedItem);
      } else { // Moving to sidebar
        const newSidebarItem: ISidebarItem = { ...draggedItem, order: event.currentIndex, children: [] };
        transferArrayItem(event.previousContainer.data, this.currentSidebarItems, event.previousIndex, event.currentIndex);
        this.currentSidebarItems[event.currentIndex] = newSidebarItem;
        this.oldSidebarItems = JSON.parse(JSON.stringify(this.currentSidebarItems));
      }
    }

    this.refreshTree();
    this.updateAvailableLinks();
    this.dragReleased();
  }
  
  dragStarted(node: ISidebarItem): void {
    this.isDragging = true;
    this.draggedNode = node;
  }
  
  dragHover(node: ISidebarItem | null, action: 'on' | 'before' | null): void {
    if(this.isDragging) {
      if (action === 'on' && node?.route) {
        this.dropIntoNode = null;
        this.dragHoveredNode = null;
        this.dropAction = null;
        return;
      }

      this.dropIntoNode = null;
      this.dragHoveredNode = node;
      this.dropAction = action;
    }
  }

  dragReleased(): void {
    this.isDragging = false;
    this.draggedNode = null;
    this.dragHoveredNode = null;
    this.dropIntoNode = null;
    this.dropAction = null;
  }

  dragHoverSublistEnd(node: ISidebarItem): void {
    if (this.isDragging) {
      this.dropIntoNode = node;
      this.dragHoveredNode = null;
      this.dropAction = 'before';
    }
  }

  findParent(tree: ISidebarItem[], child: ISidebarItem): ISidebarItem | null {
    for (const item of tree) {
      if (item.children?.some(c => c.label === child.label)) {
        return item;
      }
      if (item.children) {
        const parent = this.findParent(item.children, child);
        if (parent) return parent;
      }
    }
    return null;
  }

  isDescendant(potentialParent: ISidebarItem, draggedNode: ISidebarItem): boolean {
    if (!potentialParent.children) return false;
    if (potentialParent.children.some(child => child.label === draggedNode.label)) return true;
    for (const child of potentialParent.children) {
      if (this.isDescendant(child, draggedNode)) return true;
    }
    return false;
  }

  removeItem(itemToRemove: ISidebarItem & ISidebarRemovable): void {
    if (itemToRemove.stopRemove) {
      this.snackbarService.showError("That item must always be in the Sidebar Layout.");
      return;
    }

    this.removeItemFromTree(this.currentSidebarItems, itemToRemove);
    this.refreshTree();
    this.updateAvailableLinks();
  }
  
  private removeItemFromTree(tree: ISidebarItem[], itemToRemove: ISidebarItem): boolean {
    const index = tree.findIndex(item => item.label === itemToRemove.label);

    if (index > -1) {
      if (itemToRemove.children?.length) {
          const parent = this.findParent(this.currentSidebarItems, itemToRemove);
          const parentList = parent ? parent.children! : this.currentSidebarItems;
          parentList.splice(index + 1, 0, ...itemToRemove.children);
      }
      tree.splice(index, 1);
      return true;
    }
    for (const item of tree) {
      if (item.children && this.removeItemFromTree(item.children, itemToRemove)) {
        return true;
      }
    }

    this.oldSidebarItems = JSON.parse(JSON.stringify(this.currentSidebarItems))

    return false;
  }
  
  saveChanges(): void {
    const emptyCategory = this.findEmptyCategory(this.currentSidebarItems);
    if (emptyCategory) {
      this.snackbarService.showError(`Category "${emptyCategory.label}" cannot be empty. Please add items to it or remove it.`);
      return;
    }

    this.currentSidebarItems = this.orderItems(this.currentSidebarItems);
    this.sidebarService.updateSidebarItems(this.currentSidebarItems).subscribe({
      next: () => this.snackbarService.showSuccess('Sidebar updated successfully!'),
      error: (err) => {
        this.snackbarService.showError('Failed to update sidebar.');
        console.error(err);
      },
    });
  }

  orderItems(items: (ISidebarItem & ISidebarRemovable)[]): ISidebarItem[] {
    return items.map((item, index) => {
      item.order = index + 1;
      if (item.stopRemove) delete item.stopRemove;
      if (item.children && item.children.length > 0) {
        item.children = this.orderItems(item.children);
      }
      return item;
    });
  }

  isLastItem(node: ISidebarItem) {
    return this.currentSidebarItems.indexOf(node) == this.currentSidebarItems.length - 1;
  }

  addCategory(): void {
    const existingLabels = new Set(this.getAllLabels(this.currentSidebarItems));

    const baseName = 'New Category';
    let finalName = baseName;
    let counter = 2;

    while (existingLabels.has(finalName)) {
      finalName = `${baseName} ${counter}`;
      counter++;
    }

    const newCategory: ISidebarItem = {
      label: finalName,
      icon: 'folder',
      order: this.currentSidebarItems.length
    };

    this.currentSidebarItems.push(newCategory);
    this.refreshTree();
  }

  editCategory(node: ISidebarItem): void {
    // 1. Get labels from the master list of available links
    const availableLabels = AVAILABLE_SIDEBAR_LINKS.map(link => link.label);

    // 2. Get all labels currently being used in the sidebar tree
    const currentLabelsInTree = this.getAllLabels(this.currentSidebarItems);

    // 3. Combine both lists, remove duplicates, and filter out the original
    //    label of the node we are currently editing.
    const forbiddenLabels = [...new Set([...availableLabels, ...currentLabelsInTree])]
    .filter(label => label !== node.label);

    const dialogRef = this.dialog.open(EditCategoryDialog, {
      width: '90vw',
      maxWidth: '400px',
      data: { 
        node: JSON.parse(JSON.stringify(node)),
        forbiddenLabels: forbiddenLabels
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        node.label = result.label;
        node.icon = result.icon;
        this.refreshTree();
      }
    });
  }

  private getAllLabels(items: ISidebarItem[]): string[] {
    let labels: string[] = [];
    for (const item of items) {
      labels.push(item.label);
      if (item.children && item.children.length > 0) {
        // Recursively get labels from children and add them to the list
        labels = labels.concat(this.getAllLabels(item.children));
      }
    }

    for (const item of AVAILABLE_SIDEBAR_LINKS) {
      labels.push(item.label);
    }

    return labels;
  }

  private findEmptyCategory(items: ISidebarItem[]): ISidebarItem | null {
    for (const item of items) {
      // Check if the item is a category (no route) AND has no children.
      if (!item.route && (!item.children || item.children.length === 0)) {
        return item; // Found an empty category!
      }

      // If the item has children, recursively check them as well.
      if (item.children && item.children.length > 0) {
        const emptyChild = this.findEmptyCategory(item.children);
        if (emptyChild) {
          return emptyChild; // Found an empty category in a sub-level.
        }
      }
    }

    return null; // No empty categories were found.
  }
}