import { Component, inject, effect, computed, afterNextRender } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService } from './client.service';
import { CreateClientRequest, ClientResponse } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  notes: string;
}

@Component({
  selector: 'app-client-form',
  imports: [FormField, ButtonComponent, BackLinkComponent],
  templateUrl: './client-form.html',
})
export class ClientFormComponent {
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly model = signal<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    vatNumber: '',
    notes: '',
  });

  readonly form = form(this.model, (f) => {
    required(f.name, { message: 'El nombre es obligatorio' });
    email(f.email, { message: 'Email inválido' });
  });

  readonly nameError = computed(() => {
    const field = this.form.name();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly emailError = computed(() => {
    const field = this.form.email();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly existing = injectQuery<ClientResponse>(() => ({
    queryKey: ['client', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.clientService.get(this.id!)),
  }));

  readonly saveMutation = injectMutation<ClientResponse, Error, CreateClientRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.isEdit ? this.clientService.update(this.id!, body) : this.clientService.create(body)),
    onSuccess: () => {
      this.notification.success(this.isEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
      this.router.navigate(['/clients']);
    },
  }));

  constructor() {
    afterNextRender(() => document.getElementById('name')?.focus());
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) this.model.set({
          name: data.name,
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          vatNumber: data.vatNumber ?? '',
          notes: data.notes ?? '',
        });
      });
    }
  }

  save(): void {
    if (this.form().invalid()) return;
    this.saveMutation.mutate(this.model() as CreateClientRequest);
  }
}
