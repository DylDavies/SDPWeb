import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { SidebarService } from './sidebar-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { ISidebarItem } from '../models/interfaces/ISidebarItem.interface';

describe('SidebarService', () => {
  let service: SidebarService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let socketSubject: Subject<any>;

  beforeEach(() => {
    // Create spies for HttpService and SocketService
    httpServiceSpy = jasmine.createSpyObj('HttpService', ['get', 'put']);
    socketSubject = new Subject();
    socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
    socketServiceSpy.listen.and.returnValue(socketSubject.asObservable());

    TestBed.configureTestingModule({
      providers: [
        SidebarService,
        { provide: HttpService, useValue: httpServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy }
      ]
    });

    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchAndCacheSidebarItems', () => {
    it('should fetch items from API if cache is empty', () => {
      const mockItems: ISidebarItem[] = [{ id: '1', name: 'Item 1' } as any];
      httpServiceSpy.get.and.returnValue(of(mockItems));

      service.fetchAndCacheSidebarItems();

      service.sidebarItems$.subscribe(items => {
        expect(items).toEqual(mockItems);
      });
      expect(httpServiceSpy.get).toHaveBeenCalledWith('sidebar');
    });

    it('should not fetch items if cache is not empty', () => {
      const mockItems: ISidebarItem[] = [{ id: '1', name: 'Item 1' } as any];
      // Pre-populate cache
      (service as any).sidebarItemsSource.next(mockItems);

      service.fetchAndCacheSidebarItems();

      expect(httpServiceSpy.get).not.toHaveBeenCalled();
    });
  });

  describe('updateSidebarItems', () => {
    it('should call PUT and update cache on success', () => {
      const newItems: ISidebarItem[] = [{ id: '2', name: 'New Item' } as any];
      httpServiceSpy.put.and.returnValue(of(newItems));

      service.updateSidebarItems(newItems).subscribe(items => {
        expect(items).toEqual(newItems);
      });

      service.sidebarItems$.subscribe(items => {
        expect(items).toEqual(newItems);
      });

      expect(httpServiceSpy.put).toHaveBeenCalledWith('sidebar', newItems);
    });
  });

  describe('clearCache', () => {
    it('should emit empty array when clearing cache', () => {
      const mockItems: ISidebarItem[] = [{ id: '1', name: 'Item 1' } as any];
      (service as any).sidebarItemsSource.next(mockItems);

      service.clearCache();

      service.sidebarItems$.subscribe(items => {
        expect(items).toEqual([]);
      });
    });
  });

  describe('SocketService integration', () => {
    it('should refetch items when sidebar-updated message is received', () => {
      const mockItems: ISidebarItem[] = [{ id: '3', name: 'Socket Item' } as any];
      httpServiceSpy.get.and.returnValue(of(mockItems));

      // Emit a socket event
      socketSubject.next(ESocketMessage.SidebarUpdated);

      service.sidebarItems$.subscribe(items => {
        expect(items).toEqual(mockItems);
      });
      expect(httpServiceSpy.get).toHaveBeenCalledWith('sidebar');
    });
  });
});
