import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from './layout/header/header';
import { ApiService } from './services/api.service';
import { LookupService } from './services/lookup.service';
import { Loader } from './components/loader/loader';

@Component({
  selector: 'app-root',
  imports: [RouterModule, Header, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'snsop-mf-portal-payment';
  isLoading: boolean = true;
  constructor(private lookup: LookupService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Preload all lookup lists first
    Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.fetchAllCountyList(),
      this.lookup.fetchAllPayamList(),
      this.lookup.fetchAllBomaList(),
    ]).then(() => {
      console.log('loaded');
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }
}
