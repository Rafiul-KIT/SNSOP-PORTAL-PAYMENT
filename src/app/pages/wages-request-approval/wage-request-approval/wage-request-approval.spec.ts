import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageRequestApproval } from './wage-request-approval';

describe('WageRequestApproval', () => {
  let component: WageRequestApproval;
  let fixture: ComponentFixture<WageRequestApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageRequestApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageRequestApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
