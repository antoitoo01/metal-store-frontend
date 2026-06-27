import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom, Observable, map } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { InboundService } from './inbound.service';
import { CatalogService } from '../catalog/catalog.service';
import { InboundDNResponse, InboundDNLineResponse, CreateInboundDNRequest, CreateInboundDNLineRequest, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { OrderLinesComponent, OrderLineItem, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

interface InboundFormData {
  supplierName: string;
  supplierVat: string;
  supplierAddress: string;
  poNumber: string;
  issueDate: string;
  notes: string;
}

@Component({
  selector: 'app-inbound-form',
  imports: [FormField, ButtonComponent, BackLinkComponent, InputComponent, OrderLinesComponent, DataStateComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/inbound" label="Volver a albaranes de entrada" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Nuevo albarán de entrada</h1>

      @if (!createdDnId()) {
        <form (submit)="createDraft($event)" class="mt-6 max-w-lg space-y-4">
          <app-input
            id="supplierName"
            [formField]="form.supplierName"
            label="Proveedor" />

          <app-input
            [formField]="form.supplierVat"
            label="CIF / NIF" />

          <app-input
            [formField]="form.supplierAddress"
            label="Dirección" />

          <app-input
            [formField]="form.poNumber"
            label="OC (opcional)" />

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
              {{ createMutation.isPending() ? 'Creando…' : 'Confirmar entrada' }}
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
            [queryKey]="['inbound-lines', createdDnId()!]" />
        </app-data-state>

        <div class="mt-4 flex gap-2">
          <app-button variant="secondary" (clicked)="goToDetail()">Ir al albarán</app-button>
          <app-button variant="primary" (clicked)="confirmEntry()" [disabled]="confirmMutation.isPending()">
            {{ confirmMutation.isPending() ? 'Confirmando…' : 'Confirmar entrada' }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class InboundFormComponent {
  private readonly inboundService = inject(InboundService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly queryClient = inject(QueryClient);
  readonly createdDnId = signal<string | null>(null);

  readonly model = signal<InboundFormData>({
    supplierName: '',
    supplierVat: '',
    supplierAddress: '',
    poNumber: '',
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

  readonly linesQuery = injectQuery<InboundDNLineResponse[]>(() => ({
    queryKey: ['inbound-lines', this.createdDnId()!],
    enabled: !!this.createdDnId(),
    queryFn: () => firstValueFrom(this.inboundService.getLines(this.createdDnId()!)),
  }));

  readonly orderedLines = computed(() => {
    const lines = this.linesQuery.data();
    if (!lines) return [];
    return lines.map(l => ({
      ...l,
      totalPrice: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
    })) as OrderLineItem[];
  });

  readonly createMutation = injectMutation<InboundDNResponse, Error, CreateInboundDNRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.inboundService.create(body)),
    onSuccess: (dn) => {
      this.notification.success('Albarán creado correctamente');
      this.createdDnId.set(dn.id);
    },
    onError: () => this.notification.error('Error al crear el albarán'),
  }));

  readonly confirmMutation = injectMutation<InboundDNResponse, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.inboundService.confirm(id)),
    onSuccess: () => {
      this.notification.success('Entrada confirmada correctamente');
      this.queryClient.invalidateQueries({ queryKey: ['inbound-lines', this.createdDnId()!] });
      this.queryClient.invalidateQueries({ queryKey: ['inbound', this.createdDnId()!] });
      this.router.navigate(['/inbound', this.createdDnId()]);
    },
    onError: () => this.notification.error('Error al confirmar la entrada'),
  }));

  readonly addLineFn = (body: CreateOrderLineItem) =>
    this.inboundService.addLine(this.createdDnId()!, body as CreateInboundDNLineRequest).pipe(
      map(line => ({ ...line, totalPrice: line.quantity * line.unitPrice * (1 + line.vatRate / 100) }) as OrderLineItem)
    );
  readonly removeLineFn = (lineId: string) => this.inboundService.removeLine(this.createdDnId()!, lineId);
  readonly searchProfiles = (q: string) => this.catalog.searchProfiles(q) as Observable<Page<SearchResultItem>>;
  readonly onSelectProfile = (item: SearchResultItem) => ({ description: item.designation, profileId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['inbound-lines', this.createdDnId()!], ['inbound', this.createdDnId()!], ['inbound']];

  constructor() {
    afterNextRender(() => document.getElementById('supplierName')?.focus());
  }

  createDraft(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) return;
    const m = this.model();
    this.createMutation.mutate({
      supplierName: m.supplierName || undefined,
      supplierVat: m.supplierVat || undefined,
      supplierAddress: m.supplierAddress || undefined,
      poNumber: m.poNumber || undefined,
      issueDate: m.issueDate || undefined,
      notes: m.notes || undefined,
    } as CreateInboundDNRequest);
  }

  createAndConfirm(): void {
    if (this.form().invalid()) return;
    const m = this.model();
    this.createMutation.mutate({
      supplierName: m.supplierName || undefined,
      supplierVat: m.supplierVat || undefined,
      supplierAddress: m.supplierAddress || undefined,
      poNumber: m.poNumber || undefined,
      issueDate: m.issueDate || undefined,
      notes: m.notes || undefined,
    } as CreateInboundDNRequest);
  }

  confirmEntry(): void {
    const id = this.createdDnId();
    if (!id) return;
    this.confirmMutation.mutate(id);
  }

  goToDetail(): void {
    const id = this.createdDnId();
    if (id) this.router.navigate(['/inbound', id]);
  }
}
