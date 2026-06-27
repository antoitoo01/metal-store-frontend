import { Component, input, output } from '@angular/core';
import { OutboundDNStatus } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-outbound-status-actions',
  imports: [ButtonComponent],
  template: `
    <div class="mt-4 flex gap-2">
      @if (status() === 'DRAFT') {
        <app-button variant="primary" size="sm" (clicked)="confirmRequest.emit()" [disabled]="isPending()">Confirmar salida</app-button>
        <app-button variant="secondary" size="sm" (clicked)="cancelRequest.emit()" [disabled]="isPending()">Cancelar</app-button>
      }
    </div>
  `,
})
export class OutboundStatusActionsComponent {
  readonly entityId = input.required<string>();
  readonly status = input.required<OutboundDNStatus>();
  readonly isPending = input.required<boolean>();
  readonly confirmRequest = output<void>();
  readonly cancelRequest = output<void>();
}
