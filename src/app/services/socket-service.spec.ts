import { TestBed } from '@angular/core/testing';

import { SocketService } from './socket-service';

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
  });

  describe('authenticate', () => {
    it('should emit authenticate event with token', () => {
      const token = 'test-token-123';
      service.authenticate(token);
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticate', token);
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
  });

  describe('unsubscribe', () => {
    it('should emit unsubscribe event with topic', () => {
      const topic = ESocketMessage.RolesUpdated;
      service.unsubscribe(topic);
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe', topic);
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
