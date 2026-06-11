import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { MainLayoutComponent } from './main-layout.component';

@Component({ template: '<p>dummy</p>', standalone: true })
class DummyComponent {}

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([
          { path: 'dummy', component: DummyComponent },
          { path: '**', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
  });

  it('renders sidebar', () => {
    const sidebar = (fixture.nativeElement as HTMLElement).querySelector('app-sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('renders topbar', () => {
    const topbar = (fixture.nativeElement as HTMLElement).querySelector('app-topbar');
    expect(topbar).toBeTruthy();
  });

  it('renders breadcrumb', () => {
    const breadcrumb = (fixture.nativeElement as HTMLElement).querySelector('app-breadcrumb');
    expect(breadcrumb).toBeTruthy();
  });

  it('renders router outlet for content', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/dummy']);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('dummy');
  });
});
