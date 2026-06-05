import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CardComponent } from './card.component';

@Component({
  template: `
    <app-card>
      <div header>Header Content</div>
      <div body>Body Content</div>
      <div footer>Footer Content</div>
    </app-card>
  `,
  imports: [CardComponent],
})
class TestHostComponent {}

describe('CardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders a card container', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="card"]');
    expect(el).toBeTruthy();
  });

  it('renders projected header content', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('[header]');
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('Header Content');
  });

  it('renders projected body content', () => {
    const body: HTMLElement = fixture.nativeElement.querySelector('[body]');
    expect(body).toBeTruthy();
    expect(body.textContent).toContain('Body Content');
  });

  it('renders projected footer content', () => {
    const footer: HTMLElement = fixture.nativeElement.querySelector('[footer]');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Footer Content');
  });
});
