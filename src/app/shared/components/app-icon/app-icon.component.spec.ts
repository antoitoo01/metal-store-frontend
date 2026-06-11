import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppIconComponent } from './app-icon.component';

describe('AppIconComponent', () => {
  let fixture: ComponentFixture<AppIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppIconComponent);
    fixture.componentRef.setInput('name', 'layout-dashboard');
    fixture.detectChanges();
  });

  it('renders the lucide icon for the given name', () => {
    const el = fixture.nativeElement.querySelector('lucide-angular');
    expect(el).toBeTruthy();
  });

  it('falls back to layout-dashboard for unknown names', () => {
    fixture.componentRef.setInput('name', 'non-existent' as any);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('lucide-angular');
    expect(el).toBeTruthy();
  });
});
