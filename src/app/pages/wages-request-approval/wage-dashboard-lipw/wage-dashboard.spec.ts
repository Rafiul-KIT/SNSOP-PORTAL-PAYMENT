import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageDashboard } from './wage-dashboard';

describe('WageDashboard', () => {
  let component: WageDashboard;
  let fixture: ComponentFixture<WageDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
