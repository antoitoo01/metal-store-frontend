import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { BreadcrumbComponent } from './breadcrumb.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, BreadcrumbComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <app-sidebar />
      <div class="flex flex-1 flex-col overflow-hidden">
        <app-topbar>
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
export class MainLayoutComponent {}
