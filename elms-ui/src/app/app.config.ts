import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { RuntimeConfigService } from './services/runtime-config.service';

function loadRuntimeConfig(config: RuntimeConfigService): () => Promise<void> {
  return () => config.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: loadRuntimeConfig,
      deps: [RuntimeConfigService],
      multi: true,
    },
    provideAnimations(),
    provideIonicAngular(),
  ]
};
