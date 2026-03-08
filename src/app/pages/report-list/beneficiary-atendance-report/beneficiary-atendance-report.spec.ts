import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAtendanceReport } from './beneficiary-atendance-report';

describe('BeneficiaryAtendanceReport', () => {
  let component: BeneficiaryAtendanceReport;
  let fixture: ComponentFixture<BeneficiaryAtendanceReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAtendanceReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAtendanceReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
