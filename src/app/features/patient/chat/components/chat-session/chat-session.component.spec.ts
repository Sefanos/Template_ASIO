import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSessionComponent } from './chat-session.component';

describe('ChatSessionComponent', () => {
  let component: ChatSessionComponent;
  let fixture: ComponentFixture<ChatSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
