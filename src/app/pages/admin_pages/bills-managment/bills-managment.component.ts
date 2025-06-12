import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BillsTableComponent } from '../../../components/admin_components/bills/bills-table/bills-table.component';
@Component({
  selector: 'app-bills-managment',
  standalone: true,
  imports: [
    CommonModule,
    BillsTableComponent
  ],
  templateUrl: './bills-managment.component.html',
  styleUrl: './bills-managment.component.css'
})
export class BillsManagmentComponent {
  // You can add any management-specific logic here if needed
}
