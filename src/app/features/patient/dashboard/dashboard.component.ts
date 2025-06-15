import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {   
  currentDate = new Date();
  activeTab: string = 'appointments'; // Onglet actif par défaut
  personalInfo = {
    photoUrl: 'assets/images/imm2.jpg',
    name: 'Sana',
    surname: 'Barkouch',
    birthDate: '1990-01-01',
    bloodType: 'O+',
    gender: 'Male',
    nationality: 'Marocaine',
    // maritalStatus: 'Célibataire',
    emergencyContact: '+212 661 234 567',
    registrationDate: '2023-01-15',
    bloodPressure: '120/80',
    lastAppointment: '15/04/2024',
    nextAppointment: '30/04/2024',
    activePrescriptions: 2 ,

    appointments: [
      { title: 'Consultation de suivi', doctor: 'Dr. Martin', date: '30 avril à 14:00', status: 'Programmé' },
      { title: 'Contrôle annuel', doctor: 'Dr. Bernard', date: '15 mai à 10:30', status: 'En attente' }
    ],
    prescriptions: [
      { name: 'Paracétamol', dosage: '3 fois par jour', doctor: 'Dr. Bernard', startDate: '15/04/2024', endDate: '30/04/2024', quantity: 1000 },
      { name: 'Ibuprofène', dosage: '2 fois par jour', doctor: 'Dr. Bernard', startDate: '20/04/2024', endDate: '05/05/2024', quantity: 400 }
    ]
  };

  
  constructor() {}
  ngOnInit(): void {
    //  un appel API 
  
    // this.fetchPersonalInfo();
  }

    // Exemple de méthode pour récupérer les données depuis une API
    fetchPersonalInfo(): void {
      // Simuler un appel API
       
      console.log('Récupération des informations personnelles...');
    }
    setActiveTab(tab: string): void {
      this.activeTab = tab;
    }

}
