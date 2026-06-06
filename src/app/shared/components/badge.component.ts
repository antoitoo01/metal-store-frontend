import { Component, input } from '@angular/core';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-badge',
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');

  protected classes(): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return `${base} ${variants[this.variant()]}`;
  }
}
