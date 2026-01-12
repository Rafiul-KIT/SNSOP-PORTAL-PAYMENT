import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportTotalBeneficiaryPaymentDetails } from './report-total-beneficiary-payment-details';

describe('ReportTotalBeneficiaryPaymentDetails', () => {
  let component: ReportTotalBeneficiaryPaymentDetails;
  let fixture: ComponentFixture<ReportTotalBeneficiaryPaymentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportTotalBeneficiaryPaymentDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportTotalBeneficiaryPaymentDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
