import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollMobileMoney } from './payroll-mobile-money';

describe('PayrollMobileMoney', () => {
  let component: PayrollMobileMoney;
  let fixture: ComponentFixture<PayrollMobileMoney>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollMobileMoney]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollMobileMoney);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
