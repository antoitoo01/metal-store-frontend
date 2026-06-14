import { SidebarItem } from './sidebar.types';

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'layout-dashboard',
  },
  {
    label: 'Clientes',
    route: '/clients',
    icon: 'users',
  },
  {
    label: 'Catálogo',
    route: '/catalog',
    icon: 'book-open',
  },
  {
    label: 'Inventario',
    route: '/inventory',
    icon: 'package',
  },
  {
    label: 'Presupuestos',
    route: '/quotes',
    icon: 'file-text',
  },
  {
    label: 'Facturación',
    route: '/billing',
    icon: 'receipt',
  },
  {
    label: 'Usuarios',
    route: '/users',
    icon: 'user-cog',
  },
  {
    label: 'Invitaciones',
    route: '/organization/invitations',
    icon: 'user-cog',
  },
];
