import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent {
  // AI assistant features
  features = [
    {
      title: 'AI-based diagnostic support',
      description: 'Get suggestions based on patient symptoms and medical history',
      icon: 'brain'
    },
    {
      title: 'Research & evidence links',
      description: 'Access relevant medical literature and clinical guidelines',
      icon: 'link'
    }
  ];
  
  constructor(private router: Router) {}
  
  openAiAssistant() {
    // Navigate to the AI diagnostic tool
    this.router.navigate(['/doctor/ai-diagnostic']);
  }
}