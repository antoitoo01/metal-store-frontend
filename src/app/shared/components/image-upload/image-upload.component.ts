import { Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-image-upload',
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col items-center gap-3">
      @if (imageUrl()) {
        <img [src]="imageUrl()" alt="Imagen" class="max-h-48 rounded-lg object-contain" />
      } @else {
        <div class="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <span class="text-sm text-gray-400 dark:text-gray-500">Sin imagen</span>
        </div>
      }

      <div class="flex gap-2">
        <app-button variant="secondary" size="sm" (clicked)="fileInput.click()" [disabled]="disabled()">
          {{ imageUrl() ? 'Cambiar imagen' : 'Subir imagen' }}
        </app-button>

        @if (imageUrl()) {
          <app-button variant="ghost" size="sm" (clicked)="remove.emit()" [disabled]="disabled()">
            Eliminar
          </app-button>
        }
      </div>

      <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" class="hidden" (change)="onFileSelected($event)" />
    </div>
  `,
})
export class ImageUploadComponent {
  readonly imageUrl = input<string | null>(null);
  readonly disabled = input(false);
  readonly uploaded = output<File>();
  readonly remove = output<void>();

  private readonly acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  protected onFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (!file) return;
    if (!this.acceptedTypes.includes(file.type)) return;
    this.uploaded.emit(file);
    el.value = '';
  }
}
