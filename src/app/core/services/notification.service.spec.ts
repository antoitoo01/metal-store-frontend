import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty notifications', () => {
    expect(service.notifications()).toEqual([]);
  });

  it('should add a notification on show()', () => {
    service.show('test message');
    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].message).toBe('test message');
    expect(service.notifications()[0].type).toBe('info');
    expect(service.notifications()[0].priority).toBe('normal');
  });

  it('should auto-dismiss after duration', () => {
    service.show('test', 'success', 1000);
    expect(service.notifications()).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    const removing = service.notifications().filter((n) => n.removing);
    expect(removing.length).toBe(1);
    vi.advanceTimersByTime(300);
    expect(service.notifications()).toHaveLength(0);
  });

  it('should not auto-dismiss with duration 0', () => {
    service.show('test', 'info', 0);
    expect(service.notifications()).toHaveLength(1);
    vi.advanceTimersByTime(10000);
    const remaining = service.notifications().filter((n) => !n.removing);
    expect(remaining.length).toBe(1);
  });

  it('should dismiss a notification by id', () => {
    service.show('test', 'info', 0);
    const id = service.notifications()[0].id;
    service.dismiss(id);
    vi.advanceTimersByTime(300);
    expect(service.notifications()).toHaveLength(0);
  });

  it('should respect maxVisible limit by queueing', () => {
    service.configure({ maxVisible: 2 });
    service.show('one', 'info', 0);
    service.show('two', 'info', 0);
    service.show('three', 'info', 0);
    expect(service.notifications().length).toBe(2);
  });

  it('should dequeue when a slot opens', () => {
    service.configure({ maxVisible: 2 });
    service.show('one', 'info', 0);
    service.show('two', 'info', 0);
    service.show('three', 'info', 0);
    expect(service.notifications().length).toBe(2);
    service.dismiss(service.notifications()[0].id);
    vi.advanceTimersByTime(300);
    expect(service.notifications().length).toBe(2);
  });

  it('should use type-specific default durations', () => {
    service.show('err', 'error', undefined);
    service.show('warn', 'warning', undefined);
    service.show('info', 'info', undefined);
    service.show('ok', 'success', undefined);
    const [err, warn, info, ok] = service.notifications();
    expect(err.duration).toBe(8000);
    expect(warn.duration).toBe(6000);
    expect(info.duration).toBe(4000);
    expect(ok.duration).toBe(3000);
  });

  it('should pause and resume dismiss timers', () => {
    service.show('test', 'info', 1000);
    vi.advanceTimersByTime(400);
    service.pauseDismiss();
    vi.advanceTimersByTime(2000);
    expect(service.notifications().some((n) => !n.removing)).toBe(true);
    service.resumeDismiss();
    vi.advanceTimersByTime(600);
    const remaining = service.notifications().filter((n) => !n.removing);
    expect(remaining.length).toBe(0);
  });

  it('should set removing flag before removing', () => {
    service.show('test', 'info', 0);
    const id = service.notifications()[0].id;
    service.dismiss(id);
    expect(service.notifications()[0].removing).toBe(true);
    vi.advanceTimersByTime(300);
    expect(service.notifications()).toHaveLength(0);
  });

  it('should support convenience methods', () => {
    service.success('ok');
    expect(service.notifications()[0].type).toBe('success');
    service.dismissAll();
    vi.advanceTimersByTime(300);
    service.error('fail');
    expect(service.notifications()[0].type).toBe('error');
    service.dismissAll();
    vi.advanceTimersByTime(300);
    service.warning('warn');
    expect(service.notifications()[0].type).toBe('warning');
    service.dismissAll();
    vi.advanceTimersByTime(300);
    service.info('info');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('should set position via configure', () => {
    expect(service.position()).toBe('bottom-right');
    service.configure({ position: 'top-left' });
    expect(service.position()).toBe('top-left');
  });
});
