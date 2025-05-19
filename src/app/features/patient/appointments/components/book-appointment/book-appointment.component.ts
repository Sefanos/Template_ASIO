import { Component, Inject } from '@angular/core';
import {  MatDialog } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

 

@Component({
  selector: 'app-book-appointment',
  standalone: false,
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent {
  doctorName = 'Dr. Sarah Johnson';

}
