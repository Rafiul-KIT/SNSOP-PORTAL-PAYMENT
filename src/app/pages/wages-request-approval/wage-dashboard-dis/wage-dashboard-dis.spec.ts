import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageDashboardDis } from './wage-dashboard-dis';

describe('WageDashboardDis', () => {
  let component: WageDashboardDis;
  let fixture: ComponentFixture<WageDashboardDis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageDashboardDis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageDashboardDis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
