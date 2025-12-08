import { Component, NgZone, OnInit } from '@angular/core';
import { Loader } from '../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ApiService } from '../../services/api.service';

interface RoleInfo {
  id: number;
  name: string;
  description?: string;
  status?: boolean;
  createdBy?: number;
  createdAt?: string;
  modifiedBy?: number;
  modifiedAt?: string;
  version?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [Loader, ButtonModule, CardModule, RouterModule, ReactiveFormsModule, BreadcrumbModule, Loader,ToastModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  providers: [MessageService]
})
export class Profile implements OnInit {
  isLoading = false;
  private initialFormValue: any = {};
  isFormUnchanged = true;
  user: any = {}; // Declare user property
  userInfo: any = null;

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'User List', routerLink: ['/user-management/users'], icon: 'fas fa-users' },
    { label: 'Register New User', icon: 'fas fa-user-plus' },
  ];

    userRegistrationForm = new FormGroup({
    username: new FormControl(''),
    fullName: new FormControl(''),
    email: new FormControl(''),
    roleId: new FormControl<number | null>(null),
    status: new FormControl(0),
    isMobile: new FormControl(false),
    emailReceiver: new FormControl(false),
    password: new FormControl(''),
  });
  userDetails: { status: 'ACTIVE' | 'INACTIVE' | 'PENDING' } | null = null;

  /*roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'User' },
  ];*/
  roles: RoleInfo[] = [];

  statusOptions = [
    { value: 1, label: 'ACTIVE' },
    { value: 0, label: 'INACTIVE' },
  ];

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService,
  ) { }

  ngOnInit(): void {
    this.userInfo = this.api.loginState()?.user;
    if (this.userInfo && this.userInfo.sub) {
      this.loadUserDetails(this.userInfo.sub);
    } else {
      console.error('User info not available in ngOnInit');
    }
    this.cdr.detectChanges();
  }


  private statusToNumber(s: string | null | undefined): 0 | 1 {
    const v = (s ?? '').toString().trim().toUpperCase();
    return v === 'ACTIVE' ? 1 : 0;
  }




  private normalizeStatus(s: string | null | undefined): 'ACTIVE' | 'INACTIVE' | 'PENDING' {
    const v = (s ?? '').toString().trim().toUpperCase();
    if (v === 'ACTIVE' || v === 'INACTIVE' || v === 'PENDING') return v as any;
    // map common variants
    if (v === 'ACTIVE') return 'ACTIVE';
    if (v === 'INACTIVE') return 'INACTIVE';
    return 'PENDING';
  }

  async loadUserDetails(userId: number): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      // URL to fetch user details directly
      const url = `api/users/findOne?id=${userId}`;

    // Use ApiService to make a GET request
    const axiosResponse = await this.api.GET<any>(url, {}, 'alt');
    const res = axiosResponse.data;
 console.log(res)
    if (res) {
      const user = res as {
        id: number;
        fullName: string;
        email: string;
        role?: string;
        status?: string;
        emailReceiver?: boolean;
        isMobile?: boolean;
        username?: string;
        roleId?: number;
      };
     
        this.user = user;
        let mappedRoleId: number | null = null;
        if (typeof user.roleId === 'number') {
          mappedRoleId = user.roleId;
        } else if (user.role) {
          const byName = this.roles.find(
            r => r.name?.trim().toLowerCase() === user.role!.trim().toLowerCase()
          );
          mappedRoleId = byName ? byName.id : null;
        }

        const formValue = {
          username: user.username ?? (user.email ? user.email.split('@')[0] : ''),
          fullName: user.fullName ?? '',
          email: user.email ?? '',
          roleId: mappedRoleId,
          status: this.statusToNumber(user.status),
          isMobile: !!user.isMobile,
          emailReceiver: !!user.emailReceiver,
          password: '',
        };
        console.log(res); 
        this.initialFormValue = formValue;
        this.userRegistrationForm.reset(formValue, { emitEvent: false });
        this.isFormUnchanged = true;
        console.log(res); 

        // set footer status info
        this.userDetails = {
          status: this.normalizeStatus(user.status),
        };
      }
    } catch (err: any) {
      console.error('Failed to load user details', err);
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Unable to load user details from server.' });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }


  editUser(userInfo: any) {
    this.router.navigate(['/user-management/register'], {
      queryParams: { id: userInfo.sub },
    });
  }
}