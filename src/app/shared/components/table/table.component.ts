import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ColumnDef, SortChange } from './column-def.type';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-table',
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host ::ng-deep td { padding: 0.5rem 1rem 0.5rem 1rem; }',
    ':host ::ng-deep tbody tr { border-bottom: 1px solid rgb(229 231 235); }',
    ':host-context(.dark) ::ng-deep tbody tr { border-bottom-color: #334155; }',
    ':host ::ng-deep tbody tr:hover { background-color: rgb(249 250 251); }',
    ':host-context(.dark) ::ng-deep tbody tr:hover { background-color: rgb(30 41 59); }',
  ],
  template: `
    <div class="overflow-hidden rounded-xl border shadow-sm dark:border-gray-700 mt-4">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            @for (col of columns(); track col.key) {
              <th
                scope="col"
                class="py-2 px-4 font-medium"
                [class.cursor-pointer]="col.sortable"
                [class.select-none]="col.sortable"
                [class.hover:bg-gray-100]="col.sortable"
                [class.dark:hover:bg-gray-700]="col.sortable"
                (click)="col.sortable && toggleSort(col.key)"
              >
                <span class="flex items-center gap-1">
                  {{ col.label }}
                  @if (col.sortable) {
                    @if (sortBy() === col.key && sortDir() === 'asc') {
                      <app-icon name="chevron-up" [size]="14" />
                    } @else if (sortBy() === col.key && sortDir() === 'desc') {
                      <app-icon name="chevron-down" [size]="14" />
                    } @else {
                      <app-icon name="chevrons-up-down" [size]="14" class="opacity-30" />
                    }
                  }
                </span>
              </th>
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
  columns = input.required<ColumnDef[]>();
  sortBy = input<string>('');
  sortDir = input<'asc' | 'desc'>('asc');
  sortChange = output<SortChange>();

  protected toggleSort(column: string): void {
    const direction = this.sortBy() === column && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ column, direction });
  }
}
