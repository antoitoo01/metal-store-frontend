import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, BreadcrumbComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      @if (mobileSidebarOpen()) {
        <div
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          (click)="mobileSidebarOpen.set(false)"
        ></div>
      }
      <app-sidebar
        [mobileOpen]="mobileSidebarOpen()"
        (closeMobile)="mobileSidebarOpen.set(false)"
      />
      <div class="flex flex-1 flex-col overflow-hidden">
        <app-topbar (toggleMenu)="mobileSidebarOpen.update(v => !v)">
          <app-breadcrumb breadcrumbs />
        </app-topbar>
        <div class="flex-1 overflow-y-auto">
          <main class="p-6">
            <router-outlet />
          </main>
        </div>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  protected readonly mobileSidebarOpen = signal(false);
}
