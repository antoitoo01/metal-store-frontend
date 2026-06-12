import { Component, computed, input } from '@angular/core';
import { AppIconName } from './app-icon-name.config';

import {
  Anvil,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  FileText,
  LayoutDashboard,
  LucideAngularModule,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  UserCog,
  Users,
} from 'lucide-angular';

const ICON_MAP: Record<AppIconName, any> = {
  'layout-dashboard': LayoutDashboard,
  'users': Users,
  'book-open': BookOpen,
  'package': Package,
  'file-text': FileText,
  'receipt': Receipt,
  'user-cog': UserCog,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  'anvil': Anvil,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevrons-up-down': ChevronsUpDown,
};

@Component({
  selector: 'app-icon',
  imports: [LucideAngularModule],
  template: `
    <lucide-angular
      [img]="icon()"
      [size]="size()"
    />
  `,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
  readonly size = input(20);

  protected readonly icon = computed(() => ICON_MAP[this.name()] ?? LayoutDashboard);
}
