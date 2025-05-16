import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  // Notifications data
  notifications = [
    {
      type: 'urgent',
      title: 'Critical lab result',
      message: 'Patient Michel B. has abnormal kidney function values',
      time: '10 minutes ago',
      icon: 'alert-triangle'
    },
    {
      type: 'info',
      title: 'Prescription refill request',
      message: 'Patient Sophie L. requested a prescription refill',
      time: '35 minutes ago',
      icon: 'bell'
    },
    {
      type: 'primary',
      title: 'New message from Dr. Lambert',
      message: 'RE: Patient referral for specialist consultation',
      time: '2 hours ago',
      icon: 'mail'
    }
  ];
}
