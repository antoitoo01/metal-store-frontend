import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div data-testid="card" class="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div data-testid="card-header" class="border-b border-gray-100 px-6 py-4 font-semibold text-gray-900">
        <ng-content select="[header]" />
      </div>
      <div data-testid="card-body" class="px-6 py-4">
        <ng-content select="[body]" />
      </div>
      <div data-testid="card-footer" class="border-t border-gray-100 px-6 py-4">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class CardComponent {}
