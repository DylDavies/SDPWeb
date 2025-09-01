import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StudyGroupService } from './study-group-service';

describe('StudyGroupService', () => {
  let service: StudyGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(StudyGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
