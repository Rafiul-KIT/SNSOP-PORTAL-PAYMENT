import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WagePaidRequestAbstractWithInvoice } from './wage-paid-request-abstract-with-invoice';

describe('WagePaidRequestAbstractWithInvoice', () => {
  let component: WagePaidRequestAbstractWithInvoice;
  let fixture: ComponentFixture<WagePaidRequestAbstractWithInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WagePaidRequestAbstractWithInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WagePaidRequestAbstractWithInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
