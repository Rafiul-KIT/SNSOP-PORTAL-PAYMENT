import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaidDateWisePaymentInvoiceDetails } from './paid-date-wise-payment-invoice-details';

describe('PaidDateWisePaymentInvoiceDetails', () => {
  let component: PaidDateWisePaymentInvoiceDetails;
  let fixture: ComponentFixture<PaidDateWisePaymentInvoiceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaidDateWisePaymentInvoiceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaidDateWisePaymentInvoiceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
