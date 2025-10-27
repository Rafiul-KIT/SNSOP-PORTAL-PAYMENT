import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportAgeGroupGenderWiseBeneficiaryCount } from './report-age-group-gender-wise-beneficiary-count';

describe('ReportAgeGroupGenderWiseBeneficiaryCount', () => {
  let component: ReportAgeGroupGenderWiseBeneficiaryCount;
  let fixture: ComponentFixture<ReportAgeGroupGenderWiseBeneficiaryCount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportAgeGroupGenderWiseBeneficiaryCount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportAgeGroupGenderWiseBeneficiaryCount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
