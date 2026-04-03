import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubprojectView } from './subproject-view';

describe('SubprojectView', () => {
  let component: SubprojectView;
  let fixture: ComponentFixture<SubprojectView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubprojectView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubprojectView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
