import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RemarkTemplateManagement } from './remark-template-management';

describe('RemarkTemplateManagement', () => {
  let component: RemarkTemplateManagement;
  let fixture: ComponentFixture<RemarkTemplateManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemarkTemplateManagement, HttpClientTestingModule, NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemarkTemplateManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});