import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StatusBadgeComponent, statusToBadgeVariant } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders DRAFT with default variant', () => {
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('DRAFT');
  });

  it('renders ACCEPTED with success variant', () => {
    fixture.componentRef.setInput('status', 'ACCEPTED');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('ACCEPTED');
  });

  it('renders PAID with success variant', () => {
    fixture.componentRef.setInput('status', 'PAID');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PAID');
  });

  it('renders CANCELLED with danger variant', () => {
    fixture.componentRef.setInput('status', 'CANCELLED');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CANCELLED');
  });

  it('renders REJECTED with danger variant', () => {
    fixture.componentRef.setInput('status', 'REJECTED');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('REJECTED');
  });

  it('renders ISSUED with info variant', () => {
    fixture.componentRef.setInput('status', 'ISSUED');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('ISSUED');
  });

  it('uses custom label when provided', () => {
    fixture.componentRef.setInput('status', 'ISSUED');
    fixture.componentRef.setInput('label', 'Emitido');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Emitido');
  });

  it('renders ACTIVE as success', () => {
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('ACTIVE');
  });

  it('renders INACTIVE as default', () => {
    fixture.componentRef.setInput('status', 'INACTIVE');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('INACTIVE');
  });
});

describe('statusToBadgeVariant', () => {
  it('returns default for DRAFT', () => {
    expect(statusToBadgeVariant('DRAFT')).toBe('default');
  });

  it('returns success for ACCEPTED', () => {
    expect(statusToBadgeVariant('ACCEPTED')).toBe('success');
  });

  it('returns success for PAID', () => {
    expect(statusToBadgeVariant('PAID')).toBe('success');
  });

  it('returns success for ACTIVE', () => {
    expect(statusToBadgeVariant('ACTIVE')).toBe('success');
  });

  it('returns danger for CANCELLED', () => {
    expect(statusToBadgeVariant('CANCELLED')).toBe('danger');
  });

  it('returns danger for REJECTED', () => {
    expect(statusToBadgeVariant('REJECTED')).toBe('danger');
  });

  it('returns info for ISSUED', () => {
    expect(statusToBadgeVariant('ISSUED')).toBe('info');
  });

  it('returns default for unknown status', () => {
    expect(statusToBadgeVariant('UNKNOWN')).toBe('default');
  });

  it('returns default for INACTIVE', () => {
    expect(statusToBadgeVariant('INACTIVE')).toBe('default');
  });
});
