import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProficiencyService } from './proficiency-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { IProficiency } from '../models/interfaces/IProficiency.interface';

// Mock HttpService
const httpServiceSpy = jasmine.createSpyObj('HttpService', ['get']);

// Mock SocketService
const socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
socketServiceSpy.listen.and.returnValue(of(null)); 


describe('ProficiencyService', () => {
  let service: ProficiencyService;
  let httpService: jasmine.SpyObj<HttpService>;

  const mockProficiencies: IProficiency[] = [
    { name: 'Cambridge', subjects: {} },
    { name: 'IEB', subjects: {} },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProficiencyService,
        { provide: HttpService, useValue: httpServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
      ],
    });
    
    httpServiceSpy.get.and.returnValue(of([]));

    service = TestBed.inject(ProficiencyService);
    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchAllProficiencies', () => {
    it('should fetch proficiencies and update the proficiencies$ subject', (done: DoneFn) => {
      httpService.get.and.returnValue(of(mockProficiencies));

      service.fetchAllProficiencies().subscribe((proficiencies) => {
        expect(proficiencies).toEqual(mockProficiencies);
        
        expect(httpService.get).toHaveBeenCalledWith('proficiencies/fetchAll');

        service.allProficiencies$.subscribe((proficienciesFromStream) => {
          expect(proficienciesFromStream).toEqual(mockProficiencies);
          done();
        });
      });
    });
  });
});