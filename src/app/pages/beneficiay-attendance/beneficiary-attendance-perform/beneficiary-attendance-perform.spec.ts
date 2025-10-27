import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAttendancePerform } from './beneficiary-attendance-perform';

describe('BeneficiaryAttendancePerform', () => {
  let component: BeneficiaryAttendancePerform;
  let fixture: ComponentFixture<BeneficiaryAttendancePerform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAttendancePerform]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAttendancePerform);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
