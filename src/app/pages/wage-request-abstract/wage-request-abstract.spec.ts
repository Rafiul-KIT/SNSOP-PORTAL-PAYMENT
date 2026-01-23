import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageRequestAbstract } from './wage-request-abstract';

describe('WageRequestAbstract', () => {
  let component: WageRequestAbstract;
  let fixture: ComponentFixture<WageRequestAbstract>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageRequestAbstract]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageRequestAbstract);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
