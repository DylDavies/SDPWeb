import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

describe('SocketService', () => {
  let service: SocketService;
  let mockSocket: any;
  let eventCallbacks: Map<string, Function[]>;

  beforeEach(() => {
    eventCallbacks = new Map<string, Function[]>();

    // Create a mock socket object with all necessary methods
    mockSocket = {
      on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
        if (!eventCallbacks.has(event)) {
          eventCallbacks.set(event, []);
        }
        eventCallbacks.get(event)!.push(callback);
      }),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
    };

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    TestBed.configureTestingModule({
      providers: [SocketService]
    });

    service = TestBed.inject(SocketService);

    // Replace the real socket with our mock after service creation
    // @ts-ignore - accessing private property for testing
    service.socket = mockSocket;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connectionHook', () => {
    it('should register a callback for the connect event', () => {
      const callback = jasmine.createSpy('callback');
      service.connectionHook(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('connect', callback);
    });

    it('should not register callback when socket is null', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      const callback = jasmine.createSpy('callback');

      service.connectionHook(callback);

      // Since socket is null, the callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('should emit authenticate event with token', () => {
      const token = 'test-token-123';
      service.authenticate(token);
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticate', token);
    });

    it('should not emit when socket is null', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      const token = 'test-token-123';

      service.authenticate(token);

      // Socket is null, so emit should not be called
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should emit subscribe event with topic and token', () => {
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
      const topic = ESocketMessage.BadgesUpdated;
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.subscribe(topic);

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        topic,
        token: null
      });
    });

    it('should not emit when socket is null', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      const topic = ESocketMessage.UsersUpdated;

      service.subscribe(topic);

      // Socket is null, so emit should not be called
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should emit unsubscribe event with topic', () => {
      const topic = ESocketMessage.RolesUpdated;
      service.unsubscribe(topic);
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe', topic);
    });

    it('should not emit when socket is null', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      const topic = ESocketMessage.RolesUpdated;

      service.unsubscribe(topic);

      // Socket is null, so emit should not be called
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('listen', () => {
    it('should return an observable that emits when the socket receives the event', (done) => {
      const eventName = ESocketMessage.UsersUpdated;
      const testData = { userId: '123', name: 'Test User' };

      const observable = service.listen<any>(eventName);

      observable.subscribe((data) => {
        expect(data).toEqual(testData);
        done();
      });

      // Get the callback that was registered for this event and trigger it
      const callbacks = eventCallbacks.get(eventName);
      expect(callbacks).toBeDefined();
      expect(callbacks!.length).toBeGreaterThan(0);
      callbacks![callbacks!.length - 1](testData);
    });

    it('should handle multiple events', (done) => {
      const eventName = ESocketMessage.BadgesUpdated;
      const testData1 = { id: '1' };
      const testData2 = { id: '2' };
      const receivedData: any[] = [];

      const observable = service.listen<any>(eventName);

      observable.subscribe((data) => {
        receivedData.push(data);
        if (receivedData.length === 2) {
          expect(receivedData).toEqual([testData1, testData2]);
          done();
        }
      });

      // Get the callback that was registered for this event and trigger it multiple times
      const callbacks = eventCallbacks.get(eventName);
      expect(callbacks).toBeDefined();
      expect(callbacks!.length).toBeGreaterThan(0);
      const callback = callbacks![callbacks!.length - 1];
      callback(testData1);
      callback(testData2);
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      // Reset socket before each test
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      // @ts-ignore - accessing private property for testing
      service.isConnected = false;
      eventCallbacks.clear();
    });

    it('should not connect if already connected', () => {
      // @ts-ignore - accessing private property for testing
      service.isConnected = true;
      // @ts-ignore - accessing private property for testing
      service.socket = mockSocket;

      spyOn(console, 'log');

      service.connect();

      // Console.log should not be called (early return)
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not connect if socket already exists', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = mockSocket;
      // @ts-ignore - accessing private property for testing
      service.isConnected = false;

      spyOn(console, 'log');

      service.connect();

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not connect in non-browser environment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          SocketService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const serverService = TestBed.inject(SocketService);
      spyOn(console, 'log');

      serverService.connect();

      // @ts-ignore - accessing private property for testing
      expect(serverService.isConnected).toBeFalse();
      // @ts-ignore - accessing private property for testing
      expect(serverService.socket).toBeNull();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('isSocketConnected', () => {
    it('should return true when socket is connected', () => {
      // @ts-ignore - accessing private property for testing
      service.isConnected = true;
      // @ts-ignore - accessing private property for testing
      service.socket = mockSocket;

      expect(service.isSocketConnected()).toBeTrue();
    });

    it('should return false when not connected', () => {
      // @ts-ignore - accessing private property for testing
      service.isConnected = false;
      // @ts-ignore - accessing private property for testing
      service.socket = mockSocket;

      expect(service.isSocketConnected()).toBeFalse();
    });

    it('should return false when socket is null', () => {
      // @ts-ignore - accessing private property for testing
      service.isConnected = true;
      // @ts-ignore - accessing private property for testing
      service.socket = null;

      expect(service.isSocketConnected()).toBeFalse();
    });

    it('should return false when both socket is null and not connected', () => {
      // @ts-ignore - accessing private property for testing
      service.isConnected = false;
      // @ts-ignore - accessing private property for testing
      service.socket = null;

      expect(service.isSocketConnected()).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the socket when service is destroyed', () => {
      service.ngOnDestroy();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle case when socket is not initialized', () => {
      // @ts-ignore - accessing private property for testing
      service.socket = null;
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
