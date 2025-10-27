import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WagesRequestLipw } from './wages-request-lipw';

describe('WagesRequestLipw', () => {
  let component: WagesRequestLipw;
  let fixture: ComponentFixture<WagesRequestLipw>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WagesRequestLipw]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WagesRequestLipw);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
