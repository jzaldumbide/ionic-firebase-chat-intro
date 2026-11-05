import { Injectable } from '@angular/core';

import {
  initializeApp,
  getApps,
  getApp
} from 'firebase/app';

import {
  getAuth,
  signInAnonymously,
  authStateReady
} from 'firebase/auth';

import type { User } from 'firebase/auth';

import {
  getFirestore
} from 'firebase/firestore';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  // Inicialización de Firebase
  private app = getApps().length
    ? getApp()
    : initializeApp(environment.firebase);

  // Servicios Firebase
  auth = getAuth(this.app);
  db = getFirestore(this.app);

  // Estado
  connected = false;
  error = '';

  // Evita conexiones simultáneas
  private connectionPromise?: Promise<User>;

  constructor() {}

  async connect(): Promise<User> {

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.initializeConnection();

    try {
      return await this.connectionPromise;
    } finally {
      this.connectionPromise = undefined;
    }
  }

  private async initializeConnection(): Promise<User> {

    this.error = '';

    try {

      // Esperar restauración de sesión
      await authStateReady(this.auth);

      // Recuperar usuario existente
      if (this.auth.currentUser) {

        console.log(
          'Sesión recuperada:',
          this.auth.currentUser.uid
        );

        this.connected = true;

        return this.auth.currentUser;
      }

      // Autenticación anónima
      const credential = await signInAnonymously(
        this.auth
      );

      console.log(
        'Usuario anónimo:',
        credential.user.uid
      );

      this.connected = true;

      return credential.user;

    } catch (err: any) {

      console.error('Firebase Auth:', err);

      this.connected = false;

      switch (err.code) {

        case 'auth/admin-restricted-operation':
        case 'auth/operation-not-allowed':

          this.error =
            'La autenticación anónima no está habilitada.';
          break;

        case 'auth/network-request-failed':

          this.error =
            'No existe conexión a Internet.';
          break;

        case 'auth/invalid-api-key':

          this.error =
            'La API Key de Firebase es incorrecta.';
          break;

        default:

          this.error =
            'No se pudo conectar con Firebase.';
      }

      throw err;
    }
  }

  getCurrentUid(): string | undefined {
    return this.auth.currentUser?.uid;
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}