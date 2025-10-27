import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportReconciledSummaryResult } from './report-reconciled-summary-result';

describe('ReportReconciledSummaryResult', () => {
  let component: ReportReconciledSummaryResult;
  let fixture: ComponentFixture<ReportReconciledSummaryResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportReconciledSummaryResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportReconciledSummaryResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
