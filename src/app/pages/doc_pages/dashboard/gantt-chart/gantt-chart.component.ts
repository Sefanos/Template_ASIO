import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface GanttTask {
  id: number;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: number[];
  type: 'task' | 'milestone' | 'phase';
  phase: string;
  color: string;
}

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.css']
})
export class GanttChartComponent implements OnInit {
  tasks: GanttTask[] = [];
  startDate: Date = new Date(2025, 2, 1); // 1 mars 2025
  endDate: Date = new Date(2025, 7, 15);    // 15 août 2025 (to ensure all of July is visible)
  today: Date = new Date(); // ou une date simulée si besoin
  months: string[] = [];
  weeks: {start: Date, end: Date}[] = [];
  
  ngOnInit(): void {
    this.generateMonths();
    this.generateWeeks();
    this.generateTasks();
  }

  generateMonths(): void {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let currentDate = new Date(this.startDate);
    
    while (currentDate <= this.endDate) {
      this.months.push(`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  generateWeeks(): void {
    let currentDate = new Date(this.startDate);
    
    while (currentDate <= this.endDate) {
      // Trouver le début de la semaine (lundi)
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      // Fin de la semaine (dimanche)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      this.weeks.push({
        start: new Date(startOfWeek),
        end: new Date(endOfWeek)
      });
      
      // Avancer à la semaine suivante
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  generateTasks(): void {
    // Semaine d'intégration
    this.tasks.push({
      id: 0,
      name: "Semaine d'intégration",
      start: new Date(2025, 2, 1),   // 1 mars 2025
      end: new Date(2025, 2, 7),     // 7 mars 2025
      progress: 100,
      type: 'phase',
      phase: 'PHASE 0',
      color: 'bg-gray-400'
    });
    // Recherche et formation
    this.tasks.push({
      id: 1,
      name: "Recherche et formation",
      start: new Date(2025, 2, 8),   // 8 mars 2025
      end: new Date(2025, 2, 24),    // 24 mars 2025
      progress: 100,
      type: 'phase',
      phase: 'PHASE 0',
      color: 'bg-gray-400'
    });
    // Chatbot IA pour consultation
    this.tasks.push({
      id: 2,
      name: 'Chatbot IA pour consultation',
      start: new Date(2025, 2, 25),
      end: new Date(2025, 3, 15),
      progress: 100,
      type: 'task',
      phase: 'PHASE 1',
      color: 'bg-blue-500'
    });
    // API Rendez-vous
    this.tasks.push({
      id: 3,
      name: 'API Rendez-vous',
      start: new Date(2025, 3, 1),
      end: new Date(2025, 3, 30),
      progress: 100,
      type: 'task',
      phase: 'PHASE 2',
      color: 'bg-indigo-500'
    });
    // Interface Médecin (Frontend)
    this.tasks.push({
      id: 4,
      name: 'Interface Médecin (Frontend)',
      start: new Date(2025, 3, 15),
      end: new Date(2025, 5, 15),
      progress: 100,
      type: 'task',
      phase: 'PHASE 3',
      color: 'bg-green-500'
    });
    // Intégration Assistant IA
    this.tasks.push({
      id: 5,
      name: 'Intégration Assistant IA',
      start: new Date(2025, 3, 25),
      end: new Date(2025, 4, 15),
      progress: 100,
      type: 'task',
      phase: 'PHASE 4',
      color: 'bg-blue-400'
    });
    // Système de rappels
    this.tasks.push({
      id: 6,
      name: 'Système de rappels',
      start: new Date(2025, 5, 1),
      end: new Date(2025, 5, 30),
      progress: 100,
      type: 'task',
      phase: 'PHASE 5',
      color: 'bg-orange-500'
    });
    // API Dossier Médical
    this.tasks.push({
      id: 7,
      name: 'API Dossier Médical',
      start: new Date(2025, 5, 1),
      end: new Date(2025, 5, 30),
      progress: 100,
      type: 'task',
      phase: 'PHASE 5',
      color: 'bg-indigo-400'
    });
    // Tests (Juillet)
    this.tasks.push({
      id: 8,
      name: 'Tests',
      start: new Date(2025, 6, 1),   // 1 juillet 2025
      end: new Date(2025, 6, 10),    // 10 juillet 2025
      progress: 100,
      type: 'phase',
      phase: 'PHASE 6',
      color: 'bg-yellow-400'
    });
    // Refactoring (Juillet)
    this.tasks.push({
      id: 9,
      name: 'Refactoring',
      start: new Date(2025, 6, 5),   // 5 juillet 2025
      end: new Date(2025, 6, 13),    // 13 juillet 2025
      progress: 100,
      type: 'phase',
      phase: 'PHASE 6',
      color: 'bg-pink-400'
    });
    // Documentation (Juillet)
    this.tasks.push({
      id: 10,
      name: 'Documentation',
      start: new Date(2025, 6, 8),   // 8 juillet 2025
      end: new Date(2025, 6, 15),    // 15 juillet 2025
      progress: 100,
      type: 'phase',
      phase: 'PHASE 6',
      color: 'bg-gray-600'
    });
  }

  // Calcul de la position et largeur des barres
  getTaskPosition(task: GanttTask): { left: string, width: string } {
    const totalDays = Math.round((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskStartDays = Math.round((task.start.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDuration = Math.round((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const left = (taskStartDays / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  }

  isToday(date: Date): boolean {
    return date.toDateString() === this.today.toDateString();
  }

  formatDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}
