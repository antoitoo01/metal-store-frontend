import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuoteStatus } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-quote-status-actions',
  imports: [ButtonComponent, RouterLink],
  template: `
    <div class="mt-4 flex gap-2">
      @if (status() === 'DRAFT') {
        <app-button variant="primary" size="sm" (clicked)="transition.emit('issue')" [disabled]="isPending()">Emitir</app-button>
        <a [routerLink]="['/quotes', entityId(), 'edit']" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700">Editar</a>
        <app-button variant="secondary" size="sm" (clicked)="cancelRequest.emit()" [disabled]="isPending()">Cancelar</app-button>
      }
      @if (status() === 'ISSUED') {
        <app-button variant="primary" size="sm" (clicked)="transition.emit('accept')" [disabled]="isPending()">Aceptar</app-button>
        <app-button variant="danger" size="sm" (clicked)="transition.emit('reject')" [disabled]="isPending()">Rechazar</app-button>
        <app-button variant="secondary" size="sm" (clicked)="cancelRequest.emit()" [disabled]="isPending()">Cancelar</app-button>
      }
      @if (status() === 'ISSUED' || status() === 'ACCEPTED' || status() === 'DRAFT') {
        <app-button variant="outline" size="sm" (clicked)="exportPdf.emit()">Exportar PDF</app-button>
      }
    </div>
  `,
})
export class QuoteStatusActionsComponent {
  readonly entityId = input.required<string>();
  readonly status = input.required<QuoteStatus>();
  readonly isPending = input.required<boolean>();
  readonly transition = output<string>();
  readonly cancelRequest = output<void>();
  readonly exportPdf = output<void>();
}
