export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface SortChange {
  column: string;
  direction: 'asc' | 'desc';
}
