import { Component, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ClientService } from './client.service';
import { CreateClientRequest, ClientResponse } from '../../core/models/api.types';

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.html',
})
export class ClientFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: [''],
    phone: [''],
    address: [''],
    vatNumber: [''],
    notes: [''],
  });

  readonly existing = injectQuery<ClientResponse>(() => ({
    queryKey: ['client', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.clientService.get(this.id!)),
  }));

  readonly saveMutation = injectMutation<ClientResponse, Error, CreateClientRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.isEdit ? this.clientService.update(this.id!, body) : this.clientService.create(body)),
    onSuccess: () => this.router.navigate(['/clients']),
  }));

  constructor() {
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) this.form.patchValue(data);
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saveMutation.mutate(this.form.value as CreateClientRequest);
  }
}
