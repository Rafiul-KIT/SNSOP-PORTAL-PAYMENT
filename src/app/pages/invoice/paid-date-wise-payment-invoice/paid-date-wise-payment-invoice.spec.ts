import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaidDateWisePaymentInvoice } from './paid-date-wise-payment-invoice';

describe('PaidDateWisePaymentInvoice', () => {
  let component: PaidDateWisePaymentInvoice;
  let fixture: ComponentFixture<PaidDateWisePaymentInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaidDateWisePaymentInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaidDateWisePaymentInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
