import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ApplyForDisPayment } from './apply-for-dis-payment';
import { ApiService } from '../../../services/api.service';
import { LookupService } from '../../../services/lookup.service';

describe('ApplyForDisPayment', () => {
  let component: ApplyForDisPayment;
  let fixture: ComponentFixture<ApplyForDisPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplyForDisPayment,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        ApiService,
        LookupService
      ]
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