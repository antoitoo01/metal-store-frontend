import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { NotificationService } from '../../core/services/notification.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let service: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [NotificationService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should render nothing when no notifications', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toBe('');
  });

  it('should render a notification when added', () => {
    service.show('Hola mundo', 'info', 0);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hola mundo');
  });

  it('should apply type-specific classes', () => {
    service.success('Todo bien');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-green-600');
  });

  it('should apply error type classes', () => {
    service.error('Algo salió mal');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-red-600');
  });

  it('should dismiss on close button click', () => {
    service.show('Test', 'info', 0);
    fixture.detectChanges();
    expect(service.notifications()).toHaveLength(1);
    const btn = fixture.nativeElement.querySelector('[aria-label="Cerrar"]') as HTMLElement;
    btn.click();
    expect(service.notifications()[0]?.removing).toBe(true);
  });

  it('should render an SVG icon per type', () => {
    service.show('Test', 'success', 0);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should use default bottom-right position', () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(container.className).toContain('bottom-4');
    expect(container.className).toContain('right-4');
  });

  it('should apply top-left position when configured', () => {
    service.configure({ position: 'top-left' });
    fixture.detectChanges();
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(container.className).toContain('top-4');
    expect(container.className).toContain('left-4');
  });
});
