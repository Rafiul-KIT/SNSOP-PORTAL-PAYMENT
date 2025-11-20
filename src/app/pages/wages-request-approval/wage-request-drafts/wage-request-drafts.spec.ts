import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageRequestDrafts } from './wage-request-drafts';

describe('WageRequestDrafts', () => {
  let component: WageRequestDrafts;
  let fixture: ComponentFixture<WageRequestDrafts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageRequestDrafts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageRequestDrafts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
