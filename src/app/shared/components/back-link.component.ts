import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-link',
  imports: [RouterLink],
  template: `
    <a [routerLink]="path()" class="text-sm text-blue-600 hover:underline dark:text-blue-400">← {{ label() }}</a>
  `,
})
export class BackLinkComponent {
  readonly path = input.required<string>();
  readonly label = input.required<string>();
}
