import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DataStateComponent } from './data-state.component';

describe('DataStateComponent', () => {
  let fixture: ComponentFixture<DataStateComponent>;
  let component: DataStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataStateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('empty', false);
    fixture.detectChanges();
  });

  it('shows loading text when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando…');
  });

  it('hides content when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="data-state-content"]');
    expect(el).toBeFalsy();
  });

  it('shows error message when error is set', () => {
    fixture.componentRef.setInput('error', 'Error de conexión');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Error de conexión');
  });

  it('hides content when error is set', () => {
    fixture.componentRef.setInput('error', 'Error');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="data-state-content"]');
    expect(el).toBeFalsy();
  });

  it('shows empty message when empty is true', () => {
    fixture.componentRef.setInput('empty', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
  });

  it('shows custom empty message', () => {
    fixture.componentRef.setInput('empty', true);
    fixture.componentRef.setInput('emptyMessage', 'No hay clientes');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay clientes');
  });

  it('hides content when empty is true', () => {
    fixture.componentRef.setInput('empty', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="data-state-content"]');
    expect(el).toBeFalsy();
  });

  it('projects content when not loading, error, or empty', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('empty', false);
    fixture.componentRef.setInput('error', '');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="data-state-content"]');
    expect(el).toBeTruthy();
  });

  it('shows custom error message', () => {
    fixture.componentRef.setInput('error', 'Algo salió mal');
    fixture.componentRef.setInput('errorMessage', 'Algo salió mal');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Algo salió mal');
  });

  it('prioritizes loading over error and empty', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', 'Error');
    fixture.componentRef.setInput('empty', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando…');
    expect(fixture.nativeElement.textContent).not.toContain('Error');
    expect(fixture.nativeElement.textContent).not.toContain('No hay datos');
  });

  it('prioritizes error over empty', () => {
    fixture.componentRef.setInput('empty', true);
    fixture.componentRef.setInput('error', 'Error real');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Error real');
    expect(fixture.nativeElement.textContent).not.toContain('No hay datos');
  });

  it('renders skeleton component when skeleton mode is on and loading', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('app-skeleton');
    expect(skeleton).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Cargando…');
  });

  it('hides skeleton when loading completes', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-skeleton')).toBeTruthy();

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('empty', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-skeleton')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="data-state-content"]')).toBeTruthy();
  });
});
