import { Component, effect, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

import { SIDEBAR_ITEMS } from './sidebar.config';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    AppIconComponent,
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly storageKey = 'sidebar-collapsed'
  logoError = signal(false);
  readonly items = SIDEBAR_ITEMS;

  readonly collapsed = signal(
    localStorage.getItem(this.storageKey) === 'true',
  );

  readonly mobileOpen = input(false);
  readonly closeMobile = output<void>();

  constructor() {
    effect(() => {
      localStorage.setItem(
        this.storageKey,
        String(this.collapsed()),
      );
    });
  }

  toggle(): void {
    this.collapsed.update(value => !value);
  }

  onNavClick(): void {
    this.closeMobile.emit();
  }
}
