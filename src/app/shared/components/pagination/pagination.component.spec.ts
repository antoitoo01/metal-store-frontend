import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('shows total page count', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const text: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('5');
  });

  it('disables previous button on first page (0-indexed)', () => {
    fixture.componentRef.setInput('currentPage', 0);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const prevBtn = buttons[0];
    expect(prevBtn.disabled).toBe(true);
  });

  it('enables previous button after first page', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const prevBtn = buttons[0];
    expect(prevBtn.disabled).toBe(false);
  });

  it('disables next button on last page', () => {
    fixture.componentRef.setInput('currentPage', 4);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn.disabled).toBe(true);
  });

  it('emits pageChange when clicking next', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    let emitted = -1;
    component.pageChange.subscribe((p: number) => (emitted = p));

    // buttons: [«, ‹, ›, »] — index 2 is › (next)
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    buttons[2].click();
    expect(emitted).toBe(2);
  });

  it('emits pageChange when clicking previous', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    let emitted = -1;
    component.pageChange.subscribe((p: number) => (emitted = p));

    // buttons: [«, ‹, ›, »] — index 1 is ‹ (previous)
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    expect(emitted).toBe(2);
  });

  it('renders nothing when totalPages <= 1', () => {
    fixture.componentRef.setInput('currentPage', 0);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
