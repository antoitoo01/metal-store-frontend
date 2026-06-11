import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SkeletonComponent] });
    fixture = TestBed.createComponent(SkeletonComponent);
    fixture.detectChanges();
  });

  it('renders table skeleton by default', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="skeleton-row"]');
    expect(rows.length).toBe(5);
    const cells = rows[0].querySelectorAll('[data-testid="skeleton-cell"]');
    expect(cells.length).toBe(4);
  });

  it('renders specified number of rows and columns', () => {
    fixture.componentRef.setInput('rows', 3);
    fixture.componentRef.setInput('columns', 2);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="skeleton-row"]');
    expect(rows.length).toBe(3);
    const cells = rows[0].querySelectorAll('[data-testid="skeleton-cell"]');
    expect(cells.length).toBe(2);
  });

  it('renders card skeleton with pulse class', () => {
    fixture.componentRef.setInput('type', 'card');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('[data-testid="skeleton-card"]');
    expect(card).toBeTruthy();
    expect(card.classList.contains('animate-pulse')).toBe(true);
  });

  it('table rows have animate-pulse class', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="skeleton-row"]');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.classList.contains('animate-pulse')).toBe(true);
    }
  });
});
