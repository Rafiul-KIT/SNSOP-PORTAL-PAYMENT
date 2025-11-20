import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageRequestDetails } from './wage-request-details';

describe('WageRequestDetails', () => {
  let component: WageRequestDetails;
  let fixture: ComponentFixture<WageRequestDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageRequestDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageRequestDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
