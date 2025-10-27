import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WagesRequestDis } from './wages-request-dis';

describe('WagesRequestDis', () => {
  let component: WagesRequestDis;
  let fixture: ComponentFixture<WagesRequestDis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WagesRequestDis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WagesRequestDis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
