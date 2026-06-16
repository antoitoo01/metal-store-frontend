import { Component, inject, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { CatalogService, ImageUploadResponse } from './catalog.service';
import { CatalogProfile } from '../../core/models/api.types';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-catalog-profile-detail',
  imports: [BackLinkComponent, DataStateComponent, ImageUploadComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/catalog/profiles" label="Volver a perfiles" />

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar perfil' : undefined" [empty]="false">
        @let p = query.data()!;

        <div class="mt-4 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="md:col-span-2">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ p.designation }}</h1>
            <dl class="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Familia</dt><dd class="text-gray-900 dark:text-white">{{ p.family.name }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Norma</dt><dd class="text-gray-900 dark:text-white">{{ p.family.standard }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Tipo</dt><dd class="text-gray-900 dark:text-white">{{ p.family.shapeType }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Código de familia</dt><dd class="text-gray-900 dark:text-white">{{ p.family.code }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Peso</dt><dd class="text-gray-900 dark:text-white">{{ p.weightKgM ?? '—' }} kg/m</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Área</dt><dd class="text-gray-900 dark:text-white">{{ p.areaCm2 ?? '—' }} cm²</dd></div>
            </dl>
          </div>

          <div>
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Imagen</h2>
            <div class="mt-2">
              <app-image-upload
                [imageUrl]="imageUrl()"
                [disabled]="uploadMutation.isPending() || deleteMutation.isPending()"
                (uploaded)="uploadImage($event)"
                (remove)="deleteImage()"
              />
            </div>
          </div>
        </div>
      </app-data-state>
    </div>
  `,
})
export class CatalogProfileDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly query = injectQuery<CatalogProfile>(() => ({
    queryKey: ['catalog-profile', this.id],
    queryFn: () => firstValueFrom(this.catalog.getProfile(this.id)),
  }));

  readonly imageUrl = computed(() => {
    const p = this.query.data();
    return p?.imagePath ? `${this.catalog.apiUrl}${p.imagePath}` : null;
  });

  readonly uploadMutation = injectMutation<ImageUploadResponse, Error, File>(() => ({
    mutationFn: (file) => firstValueFrom(this.catalog.uploadProfileImage(this.id, file)),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-profile', this.id] }),
  }));

  readonly deleteMutation = injectMutation<void, Error, void>(() => ({
    mutationFn: () => firstValueFrom(this.catalog.deleteProfileImage(this.id)),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-profile', this.id] }),
  }));

  uploadImage(file: File) {
    this.uploadMutation.mutate(file);
  }

  deleteImage() {
    this.deleteMutation.mutate();
  }
}
