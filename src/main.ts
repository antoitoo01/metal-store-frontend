import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

(function () {
  const stored = localStorage.getItem('metal-store-theme');
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
})();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
