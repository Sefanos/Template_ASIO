import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatComponent } from './chat.component';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface.component';
import { ChatSessionComponent } from './components/chat-session/chat-session.component';


@NgModule({
  declarations: [
    ChatComponent,
    ChatInterfaceComponent,
    ChatSessionComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule
  ]
})
export class ChatModule { }
