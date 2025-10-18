import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

// Simple unit tests without Angular TestBed
describe('SocketService', () => {
  let service: SocketService;
  let mockSocket: any;
  let mockNgZone: any;

  beforeEach(() => {
    // Create simple mocks
    mockNgZone = {
      run: (fn: any) => fn(),
      runOutsideAngular: (fn: any) => fn()
    };

    mockSocket = {
      on: jasmine.createSpy('on'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
      connected: true
    };

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    // Create service manually without Angular DI
    service = Object.create(SocketService.prototype);

    // Set up the service properties manually
    (service as any).ngZone = mockNgZone;
    (service as any).platformId = 'browser';
    (service as any).isBrowser = true;
    (service as any).socket = null;
    (service as any).isConnected = false;
    (service as any).pendingConnectionHooks = [];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connectionHook', () => {
    it('should execute callback immediately when socket is connected', () => {
      (service as any).socket = mockSocket;
      mockSocket.connected = true;
      const callback = jasmine.createSpy('callback');

      service.connectionHook(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should register callback for connect event when socket exists but not connected', () => {
      (service as any).socket = mockSocket;
      mockSocket.connected = false;
      const callback = jasmine.createSpy('callback');

      service.connectionHook(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('connect', callback);
    });

    it('should queue callback when socket is null', () => {
      (service as any).socket = null;
      const callback = jasmine.createSpy('callback');

      service.connectionHook(callback);

      expect((service as any).pendingConnectionHooks.length).toBe(1);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('should emit authenticate event with token', () => {
      (service as any).socket = mockSocket;
      const token = 'test-token-123';

      service.authenticate(token);

      expect(mockSocket.emit).toHaveBeenCalledWith('authenticate', token);
    });

    it('should not emit when socket is null', () => {
      (service as any).socket = null;
      const token = 'test-token-123';

      service.authenticate(token);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should emit subscribe event with topic and token', () => {
      (service as any).socket = mockSocket;
      const topic = ESocketMessage.UsersUpdated;
      const mockToken = 'test-token';
      (localStorage.getItem as jasmine.Spy).and.returnValue(mockToken);

      service.subscribe(topic);

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        topic,
        token: mockToken
      });
    });

    it('should handle null token when subscribing', () => {
      (service as any).socket = mockSocket;
      const topic = ESocketMessage.BadgesUpdated;
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.subscribe(topic);

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        topic,
        token: null
      });
    });

    it('should not emit when socket is null', () => {
      (service as any).socket = null;
      const topic = ESocketMessage.UsersUpdated;

      service.subscribe(topic);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should emit unsubscribe event with topic', () => {
      (service as any).socket = mockSocket;
      const topic = ESocketMessage.RolesUpdated;

      service.unsubscribe(topic);

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe', topic);
    });

    it('should not emit when socket is null', () => {
      (service as any).socket = null;
      const topic = ESocketMessage.RolesUpdated;

      service.unsubscribe(topic);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('isSocketConnected', () => {
    it('should return true when socket exists and is connected', () => {
      (service as any).socket = mockSocket;
      mockSocket.connected = true;

      expect(service.isSocketConnected()).toBeTrue();
    });

    it('should return false when socket exists but not connected', () => {
      (service as any).socket = mockSocket;
      mockSocket.connected = false;

      expect(service.isSocketConnected()).toBeFalse();
    });

    it('should return false when socket is null', () => {
      (service as any).socket = null;

      expect(service.isSocketConnected()).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the socket when service is destroyed', () => {
      (service as any).socket = mockSocket;

      service.ngOnDestroy();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle case when socket is not initialized', () => {
      (service as any).socket = null;

      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});