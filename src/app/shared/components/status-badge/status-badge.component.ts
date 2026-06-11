import { Component, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';

export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'ACCEPTED':
    case 'PAID':
    case 'ACTIVE':
      return 'success';
    case 'CANCELLED':
    case 'REJECTED':
      return 'danger';
    case 'ISSUED':
      return 'info';
    case 'DRAFT':
    case 'INACTIVE':
    default:
      return 'default';
  }
}

@Component({
  selector: 'app-status-badge',
  imports: [BadgeComponent],
  template: `
    <app-badge [variant]="statusToBadgeVariant(status())">
      {{ label() ?? status() }}
    </app-badge>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = input<string>();

  protected readonly statusToBadgeVariant = statusToBadgeVariant;
}
