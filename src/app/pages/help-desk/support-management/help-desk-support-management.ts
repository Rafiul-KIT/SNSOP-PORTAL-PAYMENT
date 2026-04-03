import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-help-desk-support-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BreadcrumbModule, ButtonModule,
    TableModule, TagModule, SelectModule, InputTextModule
  ],
  templateUrl: './help-desk-support-management.html',
  styleUrls: ['./help-desk-support-management.scss']
})
export class HelpDeskSupportManagement {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Support Management' }];

  searchText = '';
  selectedStatus: any = null;
  selectedPriority: any = null;
  selectedRole: any = null;

  statuses = [
    { label: 'All', value: null },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'New Request', value: 'New Request' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Unresolved', value: 'Unresolved' }
  ];

  priorityOptions = [
    { label: 'All', value: null },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ];

  roles = [
    { label: 'All', value: null },
    { label: 'Developer', value: 'Developer' },
    { label: 'Support Officer', value: 'Support Officer' },
    { label: 'Helpdesk', value: 'Helpdesk' },
    { label: 'System Analyst', value: 'System Analyst' }
  ];

  tickets = [
    { trackingNo: 'SNSOP-SUP-2026-000121', title: 'Payment report mismatch issue', status: 'In Progress', role: 'Developer', staff: 'Abir Hasan', priority: 'High' },
    { trackingNo: 'SNSOP-SUP-2026-000122', title: 'User role assignment problem', status: 'New Request', role: 'Support Officer', staff: 'Unassigned', priority: 'Medium' },
    { trackingNo: 'SNSOP-SUP-2026-000124', title: 'Password reset and login issue', status: 'Resolved', role: 'Helpdesk', staff: 'Nusrat Jahan', priority: 'Low' }
  ];

  filteredTickets = [...this.tickets];

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'In Progress': return 'warn';
      case 'New Request': return 'info';
      case 'Resolved': return 'success';
      case 'Unresolved': return 'danger';
      default: return 'secondary';
    }
  }

  getActionLabel(ticket: any): string {
    if (ticket.staff === 'Unassigned') return 'Assign';
    if (ticket.status === 'Resolved') return 'View';
    return 'Reassign';
  }

  getActionSeverity(ticket: any): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    if (ticket.staff === 'Unassigned') return 'success';
    if (ticket.status === 'Resolved') return 'secondary';
    return 'info';
  }

  applyFilters() {
    this.filteredTickets = this.tickets.filter(t => {
      const matchSearch = !this.searchText || t.title.toLowerCase().includes(this.searchText.toLowerCase()) || t.trackingNo.toLowerCase().includes(this.searchText.toLowerCase());
      const matchStatus = !this.selectedStatus || t.status === this.selectedStatus;
      const matchPriority = !this.selectedPriority || t.priority === this.selectedPriority;
      const matchRole = !this.selectedRole || t.role === this.selectedRole;
      return matchSearch && matchStatus && matchPriority && matchRole;
    });
  }

  onAction(ticket: any) {
    Swal.fire({
      icon: 'info',
      title: this.getActionLabel(ticket),
      text: `Action on ticket ${ticket.trackingNo}`,
      confirmButtonColor: '#3085d6'
    });
  }

  assignTicket() {
    Swal.fire({
      icon: 'info',
      title: 'Assign Ticket',
      text: 'Ticket assignment dialog would open here.',
      confirmButtonColor: '#3085d6'
    });
  }
}
