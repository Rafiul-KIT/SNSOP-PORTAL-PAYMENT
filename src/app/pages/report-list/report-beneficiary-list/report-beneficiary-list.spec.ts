import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportBeneficiaryList } from './report-beneficiary-list';

describe('ReportBeneficiaryList', () => {
  let component: ReportBeneficiaryList;
  let fixture: ComponentFixture<ReportBeneficiaryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportBeneficiaryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportBeneficiaryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
