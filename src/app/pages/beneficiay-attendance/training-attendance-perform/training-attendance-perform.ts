import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training-attendance-perform',
  imports: [],
  templateUrl: './training-attendance-perform.html',
  styleUrl: './training-attendance-perform.scss'
})
export class TrainingAttendancePerform {

  id: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }
}
