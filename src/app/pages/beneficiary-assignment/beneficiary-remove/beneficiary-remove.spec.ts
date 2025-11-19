import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BeneficiaryRemove } from './beneficiary-remove';
import { ApiService } from '../../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Helper to create a valid mock AxiosResponse
const createMockAxiosResponse = (data: any): any => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

describe('BeneficiaryRemove', () => {
  let component: BeneficiaryRemove;
  let fixture: ComponentFixture<BeneficiaryRemove>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['POST', 'GET']);
    apiServiceSpy.axiosInstance = jasmine.createSpyObj('axiosInstance', ['patch']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        BeneficiaryRemove,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ChangeDetectorRef, useValue: jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1', // Mock project ID
              },
            },
          },
        },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiaryRemove);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Provide default mock responses for calls in ngOnInit
    apiService.POST.and.returnValue(Promise.resolve(createMockAxiosResponse({ code: 200, content: [{ id: 1 }], totalElements: 1 })));
    apiService.GET.and.returnValue(Promise.resolve(createMockAxiosResponse({ code: 200, content: [], totalElements: 0 })));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and load data on init', fakeAsync(() => {
    spyOn(component, 'loadProjectData').and.callThrough();
    spyOn(component, 'loadExistingBeneficiaries').and.callThrough();

    component.ngOnInit();
    tick();

    expect(component.loadProjectData).toHaveBeenCalledWith('1');
    expect(component.loadExistingBeneficiaries).toHaveBeenCalled();
  }));
});
