import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportReconciliationSummaryCount } from './report-reconciliation-summary-count';

describe('ReportReconciliationSummaryCount', () => {
  let component: ReportReconciliationSummaryCount;
  let fixture: ComponentFixture<ReportReconciliationSummaryCount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportReconciliationSummaryCount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportReconciliationSummaryCount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
