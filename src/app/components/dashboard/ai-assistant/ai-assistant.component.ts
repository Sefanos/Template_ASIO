import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  
  openAiAssistant() {
    // Logic to open the AI assistant would go here
    console.log('Opening AI assistant...');
  }
}
