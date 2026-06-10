import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryService } from './inventory.service';
import { mockInventoryItem, mockPage } from '../testing/mock-factories';

describe('InventoryListComponent', () => {
  let fixture: ComponentFixture<InventoryListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['inventory', { page: 0, size: 20, q: '' }], mockPage([mockInventoryItem({ quantity: 50, location: 'Rack A' }), mockInventoryItem({ quantity: 10, location: 'Rack B', supplier: 'FastMetals' })]));

    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), InventoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    fixture.detectChanges();
  });

  it('renders inventory items', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('50');
    expect(text).toContain('10');
    expect(text).toContain('Rack A');
    expect(text).toContain('Rack B');
  });

  it('renders supplier info', () => {
    expect(fixture.nativeElement.textContent).toContain('FastMetals');
  });

  it('renders edit and delete actions', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Editar');
    expect(text).toContain('Eliminar');
  });
});
