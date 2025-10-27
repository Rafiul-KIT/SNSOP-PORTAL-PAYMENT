import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyForWagesPaymentComponent } from './apply-for-wages-payment.component';

describe('ApplyForWagesPaymentComponent', () => {
  let component: ApplyForWagesPaymentComponent;
  let fixture: ComponentFixture<ApplyForWagesPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyForWagesPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyForWagesPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
