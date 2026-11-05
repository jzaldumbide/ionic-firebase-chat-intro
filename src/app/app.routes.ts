import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./pages/chat/chat.page')
        .then(m => m.ChatPage)
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];