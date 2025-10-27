import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportStaffWiseBeneficiaryCount } from './report-staff-wise-beneficiary-count';

describe('ReportStaffWiseBeneficiaryCount', () => {
  let component: ReportStaffWiseBeneficiaryCount;
  let fixture: ComponentFixture<ReportStaffWiseBeneficiaryCount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportStaffWiseBeneficiaryCount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportStaffWiseBeneficiaryCount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
