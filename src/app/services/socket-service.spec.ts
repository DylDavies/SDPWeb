import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

describe('SocketService', () => {
  let service: SocketService;
  let mockSocket: any;

  beforeEach(() => {
    // Create a mock socket object with all necessary methods
    mockSocket = {
      on: jasmine.createSpy('on'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
    };

    // Mock the io function globally
    (window as any).io = jasmine.createSpy('io').and.returnValue(mockSocket);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    TestBed.configureTestingModule({
      providers: [SocketService]
    });

    service = TestBed.inject(SocketService);
  });

  afterEach(() => {
    delete (window as any).io;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register connect, disconnect, and connect_error event handlers', () => {
    expect(mockSocket.on).toHaveBeenCalledWith('connect', jasmine.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', jasmine.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', jasmine.any(Function));
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

      // Get the callback that was registered for this event
      let eventCallback: Function;
      (mockSocket.on as jasmine.Spy).and.callFake((event: string, callback: Function) => {
        if (event === eventName) {
          eventCallback = callback;
        }
      });

      const observable = service.listen<any>(eventName);

      observable.subscribe((data) => {
        expect(data).toEqual(testData);
        done();
      });

      // Simulate the socket receiving the event
      eventCallback!(testData);
    });

    it('should handle multiple events', (done) => {
      const eventName = ESocketMessage.BadgesUpdated;
      const testData1 = { id: '1' };
      const testData2 = { id: '2' };
      const receivedData: any[] = [];

      let eventCallback: Function;
      (mockSocket.on as jasmine.Spy).and.callFake((event: string, callback: Function) => {
        if (event === eventName) {
          eventCallback = callback;
        }
      });

      const observable = service.listen<any>(eventName);

      observable.subscribe((data) => {
        receivedData.push(data);
        if (receivedData.length === 2) {
          expect(receivedData).toEqual([testData1, testData2]);
          done();
        }
      });

      eventCallback!(testData1);
      eventCallback!(testData2);
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
