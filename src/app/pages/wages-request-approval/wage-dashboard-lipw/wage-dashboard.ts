import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-wage-dashboard',
  imports: [],
  templateUrl: './wage-dashboard.html',
  styleUrl: './wage-dashboard.scss'
})
export class WageDashboard implements OnInit {
  roleId!: number | null;
    private api = inject(ApiService);
   
  ngOnInit(): void {
    this.roleId = this.api.getUserRole();
   console.log(this.roleId);
  }
 
  
}
