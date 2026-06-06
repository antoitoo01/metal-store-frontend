import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TableComponent } from './table.component';

@Component({
  template: `<app-table [columns]="columns">
    @for (item of items; track item) {
      <tr><td>{{ item.name }}</td><td>{{ item.role }}</td></tr>
    }
  </app-table>`,
  imports: [TableComponent],
})
class TestHost {
  columns = ['Nombre', 'Rol'];
  items = [
    { name: 'Alice', role: 'Admin' },
    { name: 'Bob', role: 'User' },
  ];
}

describe('TableComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders column headers', () => {
    const ths: HTMLTableCellElement[] = fixture.nativeElement.querySelectorAll('thead th');
    expect(ths.length).toBe(2);
    expect(ths[0].textContent?.trim()).toBe('Nombre');
    expect(ths[1].textContent?.trim()).toBe('Rol');
  });

  it('renders projected rows inside tbody', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent?.trim()).toContain('Alice');
    expect(rows[1].textContent?.trim()).toContain('Bob');
  });

  it('wraps table in a bordered container', () => {
    const container = fixture.nativeElement.querySelector('div.overflow-hidden');
    expect(container).toBeTruthy();
    expect(container.classList.contains('rounded-xl')).toBe(true);
    expect(container.classList.contains('border')).toBe(true);
    expect(container.classList.contains('shadow-sm')).toBe(true);
  });

  it('applies standard classes to the table', () => {
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    expect(table.classList.contains('w-full')).toBe(true);
    expect(table.classList.contains('text-left')).toBe(true);
    expect(table.classList.contains('text-sm')).toBe(true);
  });

  it('applies bg-gray-50 to thead', () => {
    const thead = fixture.nativeElement.querySelector('thead');
    expect(thead.classList.contains('bg-gray-50')).toBe(true);
  });
});
