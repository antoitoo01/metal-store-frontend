import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom, Observable, map } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { OutboundService } from './outbound.service';
import { CatalogService } from '../catalog/catalog.service';
import { OutboundDNResponse, OutboundDNLineResponse, CreateOutboundDNRequest, CreateOutboundDNLineRequest, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { OrderLinesComponent, OrderLineItem, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

interface OutboundFormData {
  customerName: string;
  customerVat: string;
  customerAddress: string;
  issueDate: string;
  notes: string;
}

@Component({
  selector: 'app-outbound-form',
  imports: [FormField, ButtonComponent, BackLinkComponent, InputComponent, OrderLinesComponent, DataStateComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/outbound" label="Volver a albaranes de salida" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Nuevo albarán de salida</h1>

      @if (!createdDnId()) {
        <form (submit)="createDraft($event)" class="mt-6 max-w-lg space-y-4">
          <app-input
            id="customerName"
            [formField]="form.customerName"
            label="Cliente" />

          <app-input
            [formField]="form.customerVat"
            label="CIF / NIF" />

          <app-input
            [formField]="form.customerAddress"
            label="Dirección" />

          <app-input
            type="date"
            [formField]="form.issueDate"
            label="Fecha" />

          <app-input
            variant="textarea"
            [formField]="form.notes"
            label="Notas" />

          <div class="flex gap-2">
            <app-button type="submit" [disabled]="createMutation.isPending()">
              {{ createMutation.isPending() ? 'Creando…' : 'Guardar borrador' }}
            </app-button>
            <app-button variant="primary" type="button" (clicked)="createAndConfirm()" [disabled]="createMutation.isPending()">
              {{ createMutation.isPending() ? 'Creando…' : 'Confirmar salida' }}
            </app-button>
          </div>
        </form>
      } @else {
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Albarán creado. Ahora puedes añadir líneas.
        </p>

        <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

        <app-data-state [loading]="linesQuery.isPending()" [empty]="false">
          <app-order-lines
            [entityId]="createdDnId()!"
            [lines]="orderedLines()"
            [columns]="columnDefs"
            [canEdit]="true"
            [addLineFn]="addLineFn"
            [removeLineFn]="removeLineFn"
            [searchFn]="searchProfiles"
            [onSelectResult]="onSelectProfile"
            [invalidateKeys]="invalidateKeys"
            [queryKey]="['outbound-lines', createdDnId()!]" />
        </app-data-state>

        <div class="mt-4 flex gap-2">
          <app-button variant="secondary" (clicked)="goToDetail()">Ir al albarán</app-button>
          <app-button variant="primary" (clicked)="confirmEntry()" [disabled]="confirmMutation.isPending()">
            {{ confirmMutation.isPending() ? 'Confirmando…' : 'Confirmar salida' }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class OutboundFormComponent {
  private readonly outboundService = inject(OutboundService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly queryClient = inject(QueryClient);
  readonly createdDnId = signal<string | null>(null);

  readonly model = signal<OutboundFormData>({
    customerName: '',
    customerVat: '',
    customerAddress: '',
    issueDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  readonly form = form(this.model);

  readonly columnDefs: ColumnDef[] = [
    { key: 'lineNumber', label: '#' },
    { key: 'description', label: 'Descripción' },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'unitPrice', label: 'Precio ud.' },
    { key: 'vatRate', label: 'IVA' },
    { key: 'totalPrice', label: 'Total' },
    { key: '', label: '' },
  ];

  readonly linesQuery = injectQuery<OutboundDNLineResponse[]>(() => ({
    queryKey: ['outbound-lines', this.createdDnId()!],
    enabled: !!this.createdDnId(),
    queryFn: () => firstValueFrom(this.outboundService.getLines(this.createdDnId()!)),
  }));

  readonly orderedLines = computed(() => {
    const lines = this.linesQuery.data();
    if (!lines) return [];
    return lines.map(l => ({
      ...l,
      totalPrice: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
    })) as OrderLineItem[];
  });

  readonly createMutation = injectMutation<OutboundDNResponse, Error, CreateOutboundDNRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.outboundService.create(body)),
    onSuccess: (dn) => {
      this.notification.success('Albarán creado correctamente');
      this.createdDnId.set(dn.id);
    },
    onError: () => this.notification.error('Error al crear el albarán'),
  }));

  readonly confirmMutation = injectMutation<OutboundDNResponse, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.outboundService.confirm(id)),
    onSuccess: () => {
      this.notification.success('Salida confirmada correctamente');
      this.queryClient.invalidateQueries({ queryKey: ['outbound-lines', this.createdDnId()!] });
      this.queryClient.invalidateQueries({ queryKey: ['outbound', this.createdDnId()!] });
      this.router.navigate(['/outbound', this.createdDnId()]);
    },
    onError: () => this.notification.error('Error al confirmar la salida'),
  }));

  readonly addLineFn = (body: CreateOrderLineItem) =>
    this.outboundService.addLine(this.createdDnId()!, body as CreateOutboundDNLineRequest).pipe(
      map(line => ({ ...line, totalPrice: line.quantity * line.unitPrice * (1 + line.vatRate / 100) }) as OrderLineItem)
    );
  readonly removeLineFn = (lineId: string) => this.outboundService.removeLine(this.createdDnId()!, lineId);
  readonly searchProfiles = (q: string) => this.catalog.searchProfiles(q) as Observable<Page<SearchResultItem>>;
  readonly onSelectProfile = (item: SearchResultItem) => ({ description: item.designation, profileId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['outbound-lines', this.createdDnId()!], ['outbound', this.createdDnId()!], ['outbound']];

  constructor() {
    afterNextRender(() => document.getElementById('customerName')?.focus());
  }

  createDraft(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) return;
    const m = this.model();
    this.createMutation.mutate({
      customerName: m.customerName || undefined,
      customerVat: m.customerVat || undefined,
      customerAddress: m.customerAddress || undefined,
      issueDate: m.issueDate || undefined,
      notes: m.notes || undefined,
    } as CreateOutboundDNRequest);
  }

  createAndConfirm(): void {
    if (this.form().invalid()) return;
    const m = this.model();
    this.createMutation.mutate({
      customerName: m.customerName || undefined,
      customerVat: m.customerVat || undefined,
      customerAddress: m.customerAddress || undefined,
      issueDate: m.issueDate || undefined,
      notes: m.notes || undefined,
    } as CreateOutboundDNRequest);
  }

  confirmEntry(): void {
    const id = this.createdDnId();
    if (!id) return;
    this.confirmMutation.mutate(id);
  }

  goToDetail(): void {
    const id = this.createdDnId();
    if (id) this.router.navigate(['/outbound', id]);
  }
}
