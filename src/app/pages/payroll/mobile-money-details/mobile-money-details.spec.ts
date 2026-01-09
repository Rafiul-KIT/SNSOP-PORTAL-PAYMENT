import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileMoneyDetails } from './mobile-money-details';

describe('MobileMoneyDetails', () => {
  let component: MobileMoneyDetails;
  let fixture: ComponentFixture<MobileMoneyDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileMoneyDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileMoneyDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
