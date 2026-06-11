import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BackLinkComponent } from './back-link.component';
import { provideRouter } from '@angular/router';

describe('BackLinkComponent', () => {
  let fixture: ComponentFixture<BackLinkComponent>;
  let component: BackLinkComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackLinkComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BackLinkComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('path', '/');
    fixture.componentRef.setInput('label', 'Volver');
    fixture.detectChanges();
  });

  it('renders a link with the label text', () => {
    fixture.componentRef.setInput('label', 'Volver a clientes');
    fixture.componentRef.setInput('path', '/clients');
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.textContent?.trim()).toContain('Volver a clientes');
  });

  it('renders a left arrow prefix', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.textContent?.trim()).toContain('←');
  });

  it('sets the href via path input', () => {
    fixture.componentRef.setInput('path', '/inventory');
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    const href = link.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('inventory');
  });
});
