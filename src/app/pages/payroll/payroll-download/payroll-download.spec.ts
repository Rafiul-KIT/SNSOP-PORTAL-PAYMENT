import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollDownload } from './payroll-download';

describe('PayrollDownload', () => {
  let component: PayrollDownload;
  let fixture: ComponentFixture<PayrollDownload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollDownload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollDownload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
