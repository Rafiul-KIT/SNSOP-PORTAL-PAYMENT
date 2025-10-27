import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAttendance } from './beneficiary-attendance';

describe('BeneficiaryAttendance', () => {
  let component: BeneficiaryAttendance;
  let fixture: ComponentFixture<BeneficiaryAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAttendance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
