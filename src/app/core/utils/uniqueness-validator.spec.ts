import { createUniquenessValidator } from './uniqueness-validator';
import { of, Subject } from 'rxjs';

describe('createUniquenessValidator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no error and not checking', () => {
    const v = createUniquenessValidator({ checkFn: () => of({ available: true }), fieldLabel: 'username' });
    expect(v.error()).toBeUndefined();
    expect(v.checking()).toBe(false);
    v.destroy();
  });

  it('shows error when value is taken', () => {
    const v = createUniquenessValidator({ checkFn: () => of({ available: false }), fieldLabel: 'username' });
    v.trigger('johndoe');
    vi.advanceTimersByTime(300);
    expect(v.error()).toBe('Este username ya está en uso');
    v.destroy();
  });

  it('clears error when value becomes available', () => {
    const values = new Subject<{ available: boolean }>();
    const v = createUniquenessValidator({ checkFn: () => values.asObservable(), fieldLabel: 'email' });

    v.trigger('test@test.com');
    vi.advanceTimersByTime(300);
    values.next({ available: false });
    expect(v.error()).toBe('Este email ya está en uso');

    v.trigger('test@test.com');
    vi.advanceTimersByTime(300);
    values.next({ available: true });
    expect(v.error()).toBeUndefined();
    v.destroy();
  });

  it('cancels previous request via switchMap on rapid input', () => {
    const slow = new Subject<{ available: boolean }>();
    const fast = new Subject<{ available: boolean }>();

    let callCount = 0;
    const v = createUniquenessValidator({
      checkFn: (val) => {
        callCount++;
        return val === 'slow' ? slow.asObservable() : fast.asObservable();
      },
      fieldLabel: 'username',
    });

    v.trigger('slow');
    vi.advanceTimersByTime(300);
    v.trigger('fast');
    vi.advanceTimersByTime(300);

    slow.next({ available: false });
    expect(v.error()).toBeUndefined();

    fast.next({ available: true });
    expect(v.error()).toBeUndefined();
    v.destroy();
  });

  it('recheck returns false when value is taken', () => {
    const v = createUniquenessValidator({ checkFn: () => of({ available: false }), fieldLabel: 'username' });
    v.trigger('taken');
    vi.advanceTimersByTime(300);

    let result = false;
    v.recheck().subscribe(r => result = r);

    expect(result).toBe(false);
    expect(v.error()).toBe('Este username ya está en uso');
    v.destroy();
  });

  it('recheck returns true when value is free', () => {
    const v = createUniquenessValidator({ checkFn: () => of({ available: true }), fieldLabel: 'username' });
    v.trigger('free');
    vi.advanceTimersByTime(300);

    let result = false;
    v.recheck().subscribe(r => result = r);

    expect(result).toBe(true);
    expect(v.error()).toBeUndefined();
    v.destroy();
  });
});
