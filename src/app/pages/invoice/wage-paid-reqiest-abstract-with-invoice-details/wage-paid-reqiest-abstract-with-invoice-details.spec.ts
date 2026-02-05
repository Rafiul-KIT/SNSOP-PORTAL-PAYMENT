import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WagePaidReqiestAbstractWithInvoiceDetails } from './wage-paid-reqiest-abstract-with-invoice-details';

describe('WagePaidReqiestAbstractWithInvoiceDetails', () => {
  let component: WagePaidReqiestAbstractWithInvoiceDetails;
  let fixture: ComponentFixture<WagePaidReqiestAbstractWithInvoiceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WagePaidReqiestAbstractWithInvoiceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WagePaidReqiestAbstractWithInvoiceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
