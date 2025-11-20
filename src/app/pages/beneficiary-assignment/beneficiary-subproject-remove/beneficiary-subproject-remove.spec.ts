import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiarySubprojectRemove } from './beneficiary-subproject-remove';

describe('BeneficiarySubprojectRemove', () => {
  let component: BeneficiarySubprojectRemove;
  let fixture: ComponentFixture<BeneficiarySubprojectRemove>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiarySubprojectRemove]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiarySubprojectRemove);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
