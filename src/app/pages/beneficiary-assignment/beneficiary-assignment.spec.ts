import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAssignment } from './beneficiary-assignment';

describe('BeneficiaryAssignment', () => {
  let component: BeneficiaryAssignment;
  let fixture: ComponentFixture<BeneficiaryAssignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAssignment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAssignment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
