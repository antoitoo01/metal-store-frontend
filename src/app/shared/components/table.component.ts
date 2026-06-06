import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host ::ng-deep td { padding: 0.5rem 1rem 0.5rem 0; }',
    ':host ::ng-deep tbody tr { border-bottom: 1px solid rgb(229 231 235); }',
    ':host-context(.dark) ::ng-deep tbody tr { border-bottom-color: #334155; }',
    ':host ::ng-deep tbody tr:hover { background-color: rgb(249 250 251); }',
    ':host-context(.dark) ::ng-deep tbody tr:hover { background-color: rgb(30 41 59); }',
  ],
  template: `
    <div class="overflow-hidden rounded-xl border shadow-sm dark:border-gray-700">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            @for (col of columns(); track col) {
              <th scope="col" class="py-2 pr-4 font-medium">{{ col }}</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y">
          <ng-content />
        </tbody>
      </table>
    </div>
  `,
})
export class TableComponent {
  columns = input.required<string[]>();
}
