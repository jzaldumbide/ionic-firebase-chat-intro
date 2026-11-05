import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';

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
} from '@ionic/angular/standalone';

import { FirebaseService } from '../../services/firebase';

import {
  ChatService,
  Message
} from '../../services/chat';
import { IonHeader, IonToolbar, IonTitle } from "@ionic/angular";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
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

  private firebase = inject(FirebaseService);
  private chat = inject(ChatService);

  nickname = '';
  message = '';

  messages: Message[] = [];

  connected = false;
  connecting = false;
  sending = false;

  error = '';

  private subscription?: Subscription;

  constructor() {}

  async ngOnInit() {

    this.nickname =
      localStorage.getItem('chatNickname') || '';

    await this.connect();
  }

  // Conectar con Firebase
  async connect() {

    if (this.connecting) return;

    this.connecting = true;
    this.connected = false;
    this.error = '';

    // Evitar suscripciones duplicadas
    this.subscription?.unsubscribe();

    try {

      // Autenticación anónima
      await this.firebase.connect();

      this.connected = true;

      // Escuchar mensajes
      this.subscription = this.chat.getMessages()
        .subscribe({

          next: messages => {

            this.messages = messages;
            this.error = '';

          },

          error: err => {

            console.error(err);

            this.error =
              'No se pudieron cargar los mensajes.';

          }

        });

    } catch (err) {

      console.error(
        'Error al conectar:',
        err
      );

      this.connected = false;

      this.error = this.firebase.error ||
        'No se pudo conectar con Firebase.';

    } finally {

      this.connecting = false;

    }
  }

  // Enviar mensaje
  async send() {

    if (!this.connected || this.sending) {
      return;
    }

    const text = this.message.trim();
    const nickname = this.nickname.trim();

    if (!text || !nickname) {

      this.error =
        'Ingrese su nombre y un mensaje.';

      return;
    }

    this.sending = true;
    this.error = '';

    try {

      localStorage.setItem(
        'chatNickname',
        nickname
      );

      await this.chat.sendMessage(
        text,
        nickname
      );

      this.message = '';

    } catch (err) {

      console.error(
        'Error al enviar:',
        err
      );

      this.error =
        'No se pudo enviar el mensaje.';

    } finally {

      this.sending = false;

    }
  }

  // Identificar mensajes propios
  isMine(msg: Message): boolean {

    return msg.uid ===
      this.firebase.getCurrentUid();

  }

  // Cancelar suscripción
  ngOnDestroy() {

    this.subscription?.unsubscribe();

  }
}