import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((c) => c.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((c) => c.RegisterComponent) },
  { path: 'invitations/accept', loadComponent: () => import('./features/invitations/invitation-accept.component').then((c) => c.InvitationAcceptComponent) },
  { path: 'forbidden', loadComponent: () => import('./features/errors/forbidden.component').then((c) => c.ForbiddenComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/auth/dashboard.component').then((c) => c.DashboardComponent),
      },
      {
        path: 'clients',
        children: [
          { path: '', loadComponent: () => import('./features/clients/client-list.component').then((c) => c.ClientListComponent) },
          { path: 'new', loadComponent: () => import('./features/clients/client-form.component').then((c) => c.ClientFormComponent) },
          { path: ':id', loadComponent: () => import('./features/clients/client-detail.component').then((c) => c.ClientDetailComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/clients/client-form.component').then((c) => c.ClientFormComponent) },
          { path: ':id/detail', redirectTo: ':id' },
        ],
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog-layout.component').then((c) => c.CatalogLayoutComponent),
        children: [
          { path: '', redirectTo: 'profiles', pathMatch: 'full' },
          { path: 'profiles', loadComponent: () => import('./features/catalog/catalog-profiles.component').then((c) => c.CatalogProfilesComponent) },
          { path: 'profiles/:id', loadComponent: () => import('./features/catalog/catalog-profile-detail.component').then((c) => c.CatalogProfileDetailComponent) },
          { path: 'items', loadComponent: () => import('./features/catalog/catalog-items.component').then((c) => c.CatalogItemsComponent) },
          { path: 'items/:id', loadComponent: () => import('./features/catalog/catalog-item-detail.component').then((c) => c.CatalogItemDetailComponent) },
          { path: 'families', loadComponent: () => import('./features/catalog/catalog-families.component').then((c) => c.CatalogFamiliesComponent) },
          { path: 'item-types', loadComponent: () => import('./features/catalog/catalog-item-types.component').then((c) => c.CatalogItemTypesComponent) },
        ],
      },
      {
        path: 'inventory',
        children: [
          { path: '', loadComponent: () => import('./features/inventory/inventory-list.component').then((c) => c.InventoryListComponent) },
          { path: 'new', loadComponent: () => import('./features/inventory/inventory-form.component').then((c) => c.InventoryFormComponent) },
          { path: ':id', loadComponent: () => import('./features/inventory/inventory-form.component').then((c) => c.InventoryFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/inventory/inventory-form.component').then((c) => c.InventoryFormComponent) },
        ],
      },
      {
        path: 'users',
        children: [
          { path: '', loadComponent: () => import('./features/users/user-list.component').then((c) => c.UserListComponent) },
          { path: ':id', loadComponent: () => import('./features/users/user-detail.component').then((c) => c.UserDetailComponent) },
        ],
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/profile.component').then((c) => c.ProfileComponent),
      },
      {
        path: 'organization/invitations',
        children: [
          { path: '', loadComponent: () => import('./features/organization/invitation-list.component').then((c) => c.InvitationListComponent) },
          { path: 'new', loadComponent: () => import('./features/organization/invitation-form.component').then((c) => c.InvitationFormComponent) },
        ],
      },
      {
        path: 'quotes',
        children: [
          { path: '', loadComponent: () => import('./features/quotes/quote-list.component').then((c) => c.QuoteListComponent) },
          { path: 'new', loadComponent: () => import('./features/quotes/quote-form.component').then((c) => c.QuoteFormComponent) },
          { path: ':id', loadComponent: () => import('./features/quotes/quote-detail.component').then((c) => c.QuoteDetailComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/quotes/quote-form.component').then((c) => c.QuoteFormComponent) },
        ],
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/billing-layout.component').then((c) => c.BillingLayoutComponent),
        children: [
          { path: '', redirectTo: 'invoices', pathMatch: 'full' },
          { path: 'invoices', loadComponent: () => import('./features/billing/invoice-list.component').then((c) => c.InvoiceListComponent) },
          { path: 'invoices/new', loadComponent: () => import('./features/billing/invoice-form.component').then((c) => c.InvoiceFormComponent) },
          { path: 'invoices/:id', loadComponent: () => import('./features/billing/invoice-detail.component').then((c) => c.InvoiceDetailComponent) },
          { path: 'invoices/:id/edit', loadComponent: () => import('./features/billing/invoice-form.component').then((c) => c.InvoiceFormComponent) },
          { path: 'prices', loadComponent: () => import('./features/billing/price-list.component').then((c) => c.PriceListComponent) },
        ],
      },
    ],
  },
  { path: '**', loadComponent: () => import('./features/errors/not-found.component').then((c) => c.NotFoundComponent) },
];
