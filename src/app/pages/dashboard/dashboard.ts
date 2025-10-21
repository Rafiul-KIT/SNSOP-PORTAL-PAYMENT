import { Component } from '@angular/core';
import { Loader } from '../../components/loader/loader';


@Component({
  selector: 'app-dashboard',
  imports: [Loader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  isLoading: boolean = false;
}
