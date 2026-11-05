import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit, type OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText
} from '@ionic/angular';
import type { Subscription } from 'rxjs';

import { ChatService } from '../../services/chat';
import type { Message } from '../../services/chat';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText
  ]
})
export class ChatPage implements OnInit, OnDestroy {

  nickname = '';
  message = '';
  messages: Message[] = [];

  connected = false;
  sending = false;
  error = '';

  private subscription?: Subscription;

  public firebase = inject<FirebaseService>(FirebaseService);
  private chat = inject<ChatService>(ChatService);

  async ngOnInit(): Promise<void> {

    this.nickname = localStorage.getItem('chatNickname') || '';

    try {
      await this.firebase.connect();
      this.connected = true;

      this.subscription = this.chat.getMessages()
        .subscribe({
          next: messages => {
            this.messages = messages;
            this.error = '';
          },
          error: err => {
            console.error(err);
            this.error = 'No se pudieron cargar los mensajes';
          }
        });

    } catch (err) {
      console.error(err);
      this.error = 'No se pudo conectar con Firebase';
    }
  }

  async send(): Promise<void> {

    if (!this.connected || this.sending) return;

    const text = this.message.trim();
    const nickname = this.nickname.trim();

    if (!text || !nickname) {
      this.error = 'Ingrese su nombre y un mensaje';
      return;
    }

    this.sending = true;
    this.error = '';

    try {
      localStorage.setItem('chatNickname', nickname);

      await this.chat.sendMessage(text, nickname);

      this.message = '';

    } catch (err) {
      console.error(err);
      this.error = 'No se pudo enviar el mensaje';
    } finally {
      this.sending = false;
    }
  }

  isMine(msg: Message): boolean {
    return msg.uid === this.firebase.getCurrentUid();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}