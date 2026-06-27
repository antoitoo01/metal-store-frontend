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
    label: 'Proveedores',
    route: '/suppliers',
    icon: 'anvil',
  },
  {
    label: 'Inventario',
    route: '/inventory',
    icon: 'package',
  },
  {
    label: 'Órdenes de compra',
    route: '/purchase-orders',
    icon: 'menu',
  },
  {
    label: 'Albaranes entrada',
    route: '/inbound',
    icon: 'chevron-down',
  },
  {
    label: 'Albaranes salida',
    route: '/outbound',
    icon: 'chevron-up',
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
