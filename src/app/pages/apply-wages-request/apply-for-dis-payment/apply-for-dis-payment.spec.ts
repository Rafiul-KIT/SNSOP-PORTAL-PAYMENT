import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyForDisPayment } from './apply-for-dis-payment';

describe('ApplyForDisPayment', () => {
  let component: ApplyForDisPayment;
  let fixture: ComponentFixture<ApplyForDisPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyForDisPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyForDisPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
