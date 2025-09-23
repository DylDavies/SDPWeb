import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SidebarCustomization } from './sidebar-customization';
import { SidebarService } from '../../../../../services/sidebar-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { ISidebarItem } from '../../../../../models/interfaces/ISidebarItem.interface';


const createMockItems = (): ISidebarItem[] => JSON.parse(JSON.stringify([
  { _id: '1', label: 'Home', icon: 'home', route: '/dashboard', order: 1, stopRemove: true },
  { _id: '2', label: 'Profile', icon: 'person', route: '/dashboard/profile', order: 2 },
  {
    _id: '3',
    label: 'Category 1',
    icon: 'folder',
    order: 3,
    children: [
      { _id: '4', label: 'User Management', icon: 'people', route: '/dashboard/users', order: 1 }
    ]
  },
  { _id: '5', label: 'Admin', icon: 'shield', route: '/dashboard/admin', order: 4 }
]));

const createMockDropEvent = (draggedData: any, containerId: string, previousContainerId: string = containerId, currentIndex = 0, previousIndex = 0): CdkDragDrop<any> => {
  return {
    item: { data: draggedData },
    container: { id: containerId, data: [] },
    previousContainer: { id: previousContainerId, data: [draggedData] },
    currentIndex,
    previousIndex,
    isPointerOverContainer: true,
    distance: { x: 0, y: 0 },
    dropPoint: { x: 0, y: 0 },
    event: new MouseEvent('mouseup')
  } as CdkDragDrop<any>;
};


describe('SidebarCustomization', () => {
  let component: SidebarCustomization;
  let fixture: ComponentFixture<SidebarCustomization>;

  let mockSidebarService: jasmine.SpyObj<SidebarService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockMatDialog: jasmine.SpyObj<MatDialog>;
  let sidebarItemsSubject: BehaviorSubject<ISidebarItem[]>;

  beforeEach(async () => {
    sidebarItemsSubject = new BehaviorSubject<ISidebarItem[]>(createMockItems());

    mockSidebarService = jasmine.createSpyObj('SidebarService', ['updateSidebarItems'], {
      sidebarItems$: sidebarItemsSubject.asObservable()
    });

    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showSuccess']);

    mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [SidebarCustomization, NoopAnimationsModule],
      providers: [
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockMatDialog }
      ]
    })
    .overrideComponent(SidebarCustomization, {
      remove: { imports: [MatDialogModule] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarCustomization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngOnInit)', () => {
    it('should load and process initial sidebar items', () => {
      expect(component.currentSidebarItems.length).toBe(4);
      expect(component.availableLinks.length).toBeGreaterThan(0);
      expect(component.currentSidebarItems[0].stopRemove).toBeTrue();
    });

    it('should handle items not found in AVAILABLE_SIDEBAR_LINKS gracefully', () => {
      const itemsWithUnknown = [...createMockItems(), { _id: '99', label: 'Unknown Item', icon: 'help', order: 5 }];
      sidebarItemsSubject.next(itemsWithUnknown);
      fixture.detectChanges();
      // Should not throw an error and stopRemove should be undefined
      expect(component.currentSidebarItems.find(i => i._id === '99')?.stopRemove).toBeUndefined();
    });

    it('should unsubscribe on destroy', () => {
      const subscription = (component as any).sidebarSubscription;
      spyOn(subscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should show an error and not remove an item if stopRemove is true', () => {
      const itemToRemove = { _id: '1', label: 'Home', icon: 'home', route: '/dashboard', order: 1, stopRemove: true };
      const initialLength = component.currentSidebarItems.length;
      component.removeItem(itemToRemove);
      expect(component.currentSidebarItems.length).toBe(initialLength);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('That item must always be in the Sidebar Layout.');
    });

    it('should remove an item if it is allowed', () => {
      const itemToRemove = { _id: '2', label: 'Profile', icon: 'person', route: '/dashboard/profile', order: 2 };
      component.removeItem(itemToRemove);
      expect(component.currentSidebarItems.find(i => i._id === '2')).toBeUndefined();
      expect(component.availableLinks.some(l => l.route === '/dashboard/profile')).toBeTrue();
    });

    it('should promote children when a parent item is removed', () => {
      const parentToRemove = component.currentSidebarItems[2];
      const child = parentToRemove.children![0];
      component.removeItem(parentToRemove);
      expect(component.currentSidebarItems.find(i => i._id === '3')).toBeUndefined();
      expect(component.currentSidebarItems.find(i => i._id === '4')).toEqual(jasmine.objectContaining(child));
    });
  });

  describe('addCategory', () => {
    it('should add a category with the name "New Category"', () => {
      component.addCategory();
      expect(component.currentSidebarItems.some(i => i.label === 'New Category')).toBeTrue();
    });

    it('should add "New Category 2" if "New Category" already exists', () => {
      component.currentSidebarItems.push({ _id: '10', label: 'New Category', icon: 'folder', order: 5 });
      component.addCategory();
      expect(component.currentSidebarItems.some(i => i.label === 'New Category 2')).toBeTrue();
    });
  });

  describe('editCategory', () => {
    it('should update the category node when dialog is closed with a result', () => {
      const categoryNode = component.currentSidebarItems[2];
      const updatedData = { label: 'Updated Category', icon: 'new_icon' };
      mockMatDialog.open.and.returnValue({ afterClosed: () => of(updatedData) } as any);
      component.editCategory(categoryNode);
      expect(mockMatDialog.open).toHaveBeenCalled();
      expect(categoryNode.label).toBe(updatedData.label);
      expect(categoryNode.icon).toBe(updatedData.icon);
    });

    it('should NOT update when dialog is closed without a result', () => {
      const categoryNode = component.currentSidebarItems[2];
      const originalLabel = categoryNode.label;
      mockMatDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.editCategory(categoryNode);
      expect(mockMatDialog.open).toHaveBeenCalled();
      expect(categoryNode.label).toBe(originalLabel);
    });
  });

  describe('saveChanges', () => {
    it('should show error and not save if an empty category exists', () => {
      component.currentSidebarItems.push({ _id: '11', label: 'Empty', icon: 'folder', order: 5, children: [] });
      component.saveChanges();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Category "Empty" cannot be empty. Please add items to it or remove it.');
      expect(mockSidebarService.updateSidebarItems).not.toHaveBeenCalled();
    });

    it('should call updateSidebarItems and show success on successful save', () => {
      mockSidebarService.updateSidebarItems.and.returnValue(of([]));
      component.saveChanges();
      expect(mockSidebarService.updateSidebarItems).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Sidebar updated successfully!');
    });

    it('should call updateSidebarItems and show error on failed save', () => {
      mockSidebarService.updateSidebarItems.and.returnValue(throwError(() => new Error('API Error')));
      component.saveChanges();
      expect(mockSidebarService.updateSidebarItems).toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update sidebar.');
    });
  });


  describe('Utility Methods', () => {
    it('should collapse a node in isExpanded if it has no children but is expanded', () => {
      const node: ISidebarItem = { _id: '2', label: 'Profile', icon: 'person', order: 2 };
      spyOn(component.treeControl, 'isExpanded').and.returnValue(true);
      spyOn(component.treeControl, 'collapse');

      const result = component.isExpanded(node);

      expect(component.treeControl.collapse).toHaveBeenCalledWith(node);
      expect(result).toBeFalse();
    });

    it('should add an item from available links', () => {
      const linkToAdd = { label: 'Bundles', icon: 'inventory', route: '/dashboard/bundles' };
      component.addItem(linkToAdd);
      const addedItem = component.currentSidebarItems[component.currentSidebarItems.length - 1];
      expect(addedItem.label).toBe('Bundles');
    });

    it('isDescendant should return true for a direct child', () => {
      const parent = component.currentSidebarItems[2];
      const child = parent.children![0];
      expect(component.isDescendant(parent, child)).toBeTrue();
    });

    it('isDescendant should return false for a non-child', () => {
      const parent = component.currentSidebarItems[2];
      const nonChild = component.currentSidebarItems[1];
      expect(component.isDescendant(parent, nonChild)).toBeFalse();
    });
  });

  describe('Drag and Drop State Management', () => {
    it('dragStarted should set isDragging and draggedNode', () => {
      const node = component.currentSidebarItems[0];
      component.dragStarted(node);
      expect(component.isDragging).toBeTrue();
      expect(component.draggedNode).toBe(node);
    });

    it('dragReleased should reset all drag states', () => {
      component.isDragging = true; 
      component.dragReleased();
      expect(component.isDragging).toBeFalse();
      expect(component.draggedNode).toBeNull();
      expect(component.dragHoveredNode).toBeNull();
      expect(component.dropIntoNode).toBeNull();
      expect(component.dropAction).toBeNull();
    });

    it('dragHover should prevent nesting on items with a route', () => {
      component.isDragging = true;
      const nodeWithRoute = component.currentSidebarItems[0]; // Home
      component.dragHover(nodeWithRoute, 'on');
      expect(component.dragHoveredNode).toBeNull();
      expect(component.dropAction).toBeNull();
    });
  });

  describe('drop', () => {
    beforeEach(() => {
      component.dragStarted(component.currentSidebarItems[1]);
    });

    it('should nest an item when dropped "on" a category', () => {
      const profile = component.currentSidebarItems[1];
      const category = component.currentSidebarItems[2];

      component.dragHover(category, 'on');
      const mockEvent = createMockDropEvent(profile, 'sidebar');
      component.drop(mockEvent);

      expect(category.children?.length).toBe(2);
      expect(category.children?.[1].label).toBe('Profile');
    });

    it('should move item to end of sublist when dropped on sublist-end indicator', () => {
      const profile = component.currentSidebarItems[1];
      const category = component.currentSidebarItems[2];

      component.dragHoverSublistEnd(category);
      const mockEvent = createMockDropEvent(profile, 'sidebar');
      component.drop(mockEvent);

      expect(category.children?.length).toBe(2);
      expect(category.children?.[1].label).toBe('Profile');
    });

    it('should reorder an item when dropped "before" another item', () => {
      const admin = component.currentSidebarItems[3]; 
      const home = component.currentSidebarItems[0];

      component.dragStarted(admin);
      component.dragHover(home, 'before');
      const mockEvent = createMockDropEvent(admin, 'sidebar');
      component.drop(mockEvent);

      expect(component.currentSidebarItems[0].label).toBe('Admin');
      expect(component.currentSidebarItems[1].label).toBe('Home');
    });

    it('should move an item to the available list', () => {
      const profile = component.currentSidebarItems[1];
      const mockEvent = createMockDropEvent(profile, 'available', 'sidebar');

      component.drop(mockEvent);

      expect(component.currentSidebarItems.find(i => i.label === 'Profile')).toBeUndefined();
      expect(component.availableLinks.some(l => l.label === 'Profile')).toBeTrue();
    });

    it('should show error when trying to move a stopRemove item to available list', () => {
      const home = component.currentSidebarItems[0];
      const mockEvent = createMockDropEvent(home, 'available', 'sidebar');

      component.drop(mockEvent);

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('That item must always be in the Sidebar Layout.');
      expect(component.currentSidebarItems.find(i => i.label === 'Home')).toBeDefined();
    });
  });
});