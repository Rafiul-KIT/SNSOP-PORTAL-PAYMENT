import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReconciliationMonitoringDetails } from './reconciliation-monitoring-details';

describe('ReconciliationMonitoringDetails', () => {
  let component: ReconciliationMonitoringDetails;
  let fixture: ComponentFixture<ReconciliationMonitoringDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReconciliationMonitoringDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReconciliationMonitoringDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
