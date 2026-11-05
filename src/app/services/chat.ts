import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import type { Timestamp } from 'firebase/firestore';

import { FirebaseService } from './firebase';

export interface Message {
  id?: string;
  text: string;
  nickname: string;
  uid: string;
  createdAt?: Timestamp | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private firebase = inject(FirebaseService);

  constructor() {}

  // Enviar mensaje
  async sendMessage(
    text: string,
    nickname: string
  ) {

    const uid = this.firebase.getCurrentUid();

    const cleanText = text.trim();
    const cleanNickname = nickname.trim();

    if (!uid) {
      throw new Error('Usuario no conectado');
    }

    if (!cleanText || !cleanNickname) {
      throw new Error('Nombre o mensaje vacío');
    }

    if (
      cleanText.length > 1000 ||
      cleanNickname.length > 30
    ) {
      throw new Error('Texto demasiado largo');
    }

    return addDoc(
      collection(this.firebase.db, 'messages'),
      {
        text: cleanText,
        nickname: cleanNickname,
        uid: uid,
        createdAt: serverTimestamp()
      }
    );
  }

  // Obtener mensajes en tiempo real
  getMessages(): Observable<Message[]> {

    return new Observable<Message[]>(observer => {

      const messagesRef = collection(
        this.firebase.db,
        'messages'
      );

      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(

        q,

        snapshot => {

          const messages: Message[] =
            snapshot.docs.map(doc => ({

              id: doc.id,
              ...doc.data()

            } as Message));

          observer.next(messages.reverse());

        },

        error => {

          console.error(
            'Error Firestore:',
            error
          );

          observer.error(error);

        }

      );

      return () => unsubscribe();
    });
  }
}