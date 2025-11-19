import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryRemove } from './beneficiary-remove';

describe('BeneficiaryRemove', () => {
  let component: BeneficiaryRemove;
  let fixture: ComponentFixture<BeneficiaryRemove>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryRemove]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryRemove);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
