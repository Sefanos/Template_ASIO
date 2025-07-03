import '@n8n/chat/style.css'; // <-- Import the chat styles here
import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { createChat } from '@n8n/chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  title = 'Medical Practice Management';

  ngAfterViewInit() {
    createChat({
      webhookUrl: 'https://tasoko.app.n8n.cloud/webhook/79b9960a-2859-424c-a0df-eabb957e7e60/chat',
      target: '#n8n-chat',
      mode: 'window',
      chatInputKey: 'chatInput',
      chatSessionKey: 'sessionId',
      loadPreviousSession: true,
      metadata: {
        // Example: pass user info if available
        // userId: this.currentUser?.id,
        // userRole: this.currentUser?.role
      },
      showWelcomeScreen: false,
      defaultLanguage: 'en',
      initialMessages: [
        'Hi there! 👋',
        'How can I help you?'
      ],
      i18n: {
        en: {
          title: 'ASIO Chat',
          subtitle: "Start a chat. We're here to help you 24/7.",
          footer: '', // Hide "Powered by n8n"
          getStarted: 'New Conversation',
          inputPlaceholder: 'Type your question..',
          closeButtonTooltip: 'Close chat',
        },
      },
      theme: {
        '--chat--window--width': '420px',
        '--chat--window--height': '600px',
        '--chat--border-radius': '18px',
        '--n8n-chat-primary-color': '#2563eb',
        '--n8n-chat-background': '#fff',
        '--n8n-chat-bubble-user': '#2563eb',
        '--n8n-chat-bubble-bot': '#f1f5f9',
        '--n8n-chat-font-family': 'Inter, Segoe UI, Arial, sans-serif',
        '--chat--toggle--size': '56px',
        '--chat--toggle--background': '#2563eb',
        '--chat--toggle--color': '#fff'
      }
    });
  }
}
