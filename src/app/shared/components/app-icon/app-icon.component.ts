import { Component, computed, input } from '@angular/core';
import { AppIconName } from './app-icon-name.config';

import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LucideAngularModule,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  UserCog,
  Users,
  Anvil
} from 'lucide-angular';

@Component({
  selector: 'app-icon',
  imports: [LucideAngularModule],
  template: `
    <lucide-angular
      [img]="icon()"
      class="h-5 w-5"
    />
  `,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();

  readonly icon = computed(() => {
    switch (this.name()) {
      case 'layout-dashboard':
        return LayoutDashboard;

      case 'users':
        return Users;

      case 'book-open':
        return BookOpen;

      case 'package':
        return Package;

      case 'file-text':
        return FileText;

      case 'receipt':
        return Receipt;

      case 'user-cog':
        return UserCog;

      case 'panel-left-close':
        return PanelLeftClose;

      case 'panel-left-open':
        return PanelLeftOpen;

      case 'anvil':
        return Anvil;

      default:
        return LayoutDashboard;
    }
  });
}
