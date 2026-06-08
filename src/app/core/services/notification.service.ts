import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
export type ToastPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  priority: ToastPriority;
  removing?: boolean;
  startedAt: number;
  elapsed: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export interface ToastConfig {
  maxVisible?: number;
  position?: ToastPosition;
}

const PRIORITY_ORDER: Record<ToastPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
const DURATION_BY_TYPE: Record<NotificationType, number> = {
  error: 8000,
  warning: 6000,
  info: 4000,
  success: 3000,
};
const EXIT_ANIMATION_MS = 300;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);
  readonly paused = signal(false);

  private queue: Notification[] = [];
  private maxVisible = 5;
  private readonly _position = signal<ToastPosition>('bottom-right');

  readonly position = this._position.asReadonly();

  configure(cfg: ToastConfig): void {
    if (cfg.maxVisible !== undefined) this.maxVisible = cfg.maxVisible;
    if (cfg.position !== undefined) this._position.set(cfg.position);
  }

  show(
    message: string,
    type: NotificationType = 'info',
    duration?: number,
    priority: ToastPriority = 'normal',
  ): void {
    const id = crypto.randomUUID();
    const notif: Notification = {
      id,
      message,
      type,
      duration: duration ?? DURATION_BY_TYPE[type],
      priority,
      startedAt: performance.now(),
      elapsed: 0,
    };

    if (this.queue.length > 0 || this.notifications().length >= this.maxVisible) {
      this.enqueue(notif);
      return;
    }

    this.addAndSchedule(notif);
  }

  dismiss(id: string): void {
    const notif = this.notifications().find((n) => n.id === id);
    if (!notif || notif.removing) return;

    if (notif.timeoutId) clearTimeout(notif.timeoutId);

    this.notifications.update((n) => n.map((x) => (x.id === id ? { ...x, removing: true } : x)));

    setTimeout(() => {
      this.notifications.update((n) => n.filter((x) => x.id !== id));
      this.dequeue();
    }, EXIT_ANIMATION_MS);
  }

  dismissAll(): void {
    for (const n of this.notifications()) {
      this.dismiss(n.id);
    }
  }

  pauseDismiss(): void {
    this.paused.set(true);
    this.notifications.update((n) =>
      n.map((x) => {
        if (x.timeoutId) clearTimeout(x.timeoutId);
        return { ...x, timeoutId: undefined, elapsed: x.elapsed + (performance.now() - x.startedAt) };
      }),
    );
  }

  resumeDismiss(): void {
    this.paused.set(false);
    this.notifications.update((n) =>
      n.map((x) => {
        if (x.removing) return x;
        const remaining = Math.max(0, x.duration - x.elapsed);
        if (remaining <= 0) {
          this.dismiss(x.id);
          return x;
        }
        return { ...x, startedAt: performance.now(), timeoutId: setTimeout(() => this.dismiss(x.id), remaining) };
      }),
    );
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  warning(message: string): void { this.show(message, 'warning'); }
  info(message: string): void { this.show(message, 'info'); }

  private addAndSchedule(notif: Notification): void {
    if (notif.duration > 0 && !this.paused()) {
      notif.timeoutId = setTimeout(() => this.dismiss(notif.id), notif.duration);
    }
    this.notifications.update((n) => [...n, notif]);
  }

  private enqueue(notif: Notification): void {
    this.queue.push(notif);
    this.queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  private dequeue(): void {
    if (this.queue.length === 0) return;
    const next = this.queue.shift()!;
    this.addAndSchedule(next);
  }
}
