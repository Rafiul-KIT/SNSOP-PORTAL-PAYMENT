import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ReconciliationMonitoring } from './reconciliation-monitoring';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service';
import { MessageService } from 'primeng/api';

describe('ReconciliationMonitoring', () => {
  let component: ReconciliationMonitoring;
  let fixture: ComponentFixture<ReconciliationMonitoring>;

  const apiServiceMock = {
    POST: () => Promise.resolve({ status: 200, data: { lookups: [] } }),
    POST_FORM_DATA: () => Promise.resolve({ status: 200, data: { content: [], totalElements: 0 } }),
    GET: () => Promise.resolve({})
  };

  const lookupServiceMock = {
    getStateList: () => []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReconciliationMonitoring, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: LookupService, useValue: lookupServiceMock },
        MessageService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReconciliationMonitoring);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
