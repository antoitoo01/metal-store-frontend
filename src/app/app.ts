import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SessionExpiredModalComponent } from './shared/components/session-expired-modal/session-expired-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, SessionExpiredModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
