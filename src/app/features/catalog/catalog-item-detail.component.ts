import { Component, inject, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { CatalogService, ImageUploadResponse } from './catalog.service';
import { CatalogItem } from '../../core/models/api.types';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-catalog-item-detail',
  imports: [BackLinkComponent, DataStateComponent, ImageUploadComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/catalog/items" label="Volver a artículos" />

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar artículo' : undefined" [empty]="false">
        @let item = query.data()!;

        <div class="mt-4 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="md:col-span-2">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.designation }}</h1>
            <dl class="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">SKU</dt><dd class="text-gray-900 dark:text-white">{{ item.sku ?? '—' }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Tipo</dt><dd class="text-gray-900 dark:text-white">{{ item.itemType }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Dimensiones</dt><dd class="text-gray-900 dark:text-white">{{ item.dimensions ?? '—' }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Material</dt><dd class="text-gray-900 dark:text-white">{{ item.material ?? '—' }}</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Peso</dt><dd class="text-gray-900 dark:text-white">{{ item.weightKgM ?? '—' }} kg/m</dd></div>
              <div><dt class="font-medium text-gray-700 dark:text-gray-300">Precio est.</dt><dd class="text-gray-900 dark:text-white">{{ item.estimatedPriceKg }} €/kg</dd></div>
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
export class CatalogItemDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly query = injectQuery<CatalogItem>(() => ({
    queryKey: ['catalog-item', this.id],
    queryFn: () => firstValueFrom(this.catalog.getItem(this.id)),
  }));

  readonly imageUrl = computed(() => {
    const item = this.query.data();
    return item?.imagePath ? `${this.catalog.apiUrl}${item.imagePath}` : null;
  });

  readonly uploadMutation = injectMutation<ImageUploadResponse, Error, File>(() => ({
    mutationFn: (file) => firstValueFrom(this.catalog.uploadItemImage(this.id, file)),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-item', this.id] }),
  }));

  readonly deleteMutation = injectMutation<void, Error, void>(() => ({
    mutationFn: () => firstValueFrom(this.catalog.deleteItemImage(this.id)),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-item', this.id] }),
  }));

  uploadImage(file: File) {
    this.uploadMutation.mutate(file);
  }

  deleteImage() {
    this.deleteMutation.mutate();
  }
}
