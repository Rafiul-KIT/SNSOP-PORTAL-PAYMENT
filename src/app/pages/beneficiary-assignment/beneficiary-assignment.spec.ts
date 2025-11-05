import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BeneficiaryAssignment } from './beneficiary-assignment';
import { ApiService } from '../../services/api.service';
import { Subproject } from '../../interfaces/subproject.interface';
import { ChangeDetectorRef } from '@angular/core';

describe('BeneficiaryAssignment', () => {
  let component: BeneficiaryAssignment;
  let fixture: ComponentFixture<BeneficiaryAssignment>;
  let apiService: jasmine.SpyObj<ApiService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockSubproject: Subproject = {
    id: 1,
    workCode: 'WC001',
    projectName: 'Test Project',
    stateName: 'Test State',
    countyName: 'Test County',
    stateId: 1,
    countyId: 1,
    status: 'Active',
    screeningStatus: 'Completed',
  };

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', { axiosInstance: Promise.resolve() });
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [BeneficiaryAssignment],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAssignment);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize breadcrumb and load project data on init', fakeAsync(() => {
    spyOn(component, 'loadProjectData').and.callThrough();
    component.ngOnInit();
    tick();
    expect(component.breadcrumbItems.length).toBe(1);
    expect(component.loadProjectData).toHaveBeenCalledWith('1');
  }));

  it('should load project data successfully', fakeAsync(() => {
    const response = { data: { code: 200, content: [mockSubproject], totalElements: 1 } };
    (apiService.axiosInstance.post as jasmine.Spy).and.returnValue(Promise.resolve(response));

    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toEqual(mockSubproject);
    expect(component.targets.length).toBe(1);
    expect(component.statusMsg).toContain('Loaded 1 record(s)');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));

  it('should handle no data found', fakeAsync(() => {
    const response = { data: { code: 200, content: [], totalElements: 0 } };
    (apiService.axiosInstance.post as jasmine.Spy).and.returnValue(Promise.resolve(response));

    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toBeNull();
    expect(component.targets.length).toBe(0);
    expect(component.statusMsg).toBe('No data found.');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));

  it('should handle API error', fakeAsync(() => {
    const error = { response: { data: { message: 'Server error' } } };
    (apiService.axiosInstance.post as jasmine.Spy).and.returnValue(Promise.reject(error));

    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toBeNull();
    expect(component.targets.length).toBe(0);
    expect(component.statusMsg).toBe('Server error');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));
});
