import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiarySubprojectList } from './beneficiary-subproject-list';

describe('BeneficiarySubprojectList', () => {
  let component: BeneficiarySubprojectList;
  let fixture: ComponentFixture<BeneficiarySubprojectList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiarySubprojectList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiarySubprojectList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
