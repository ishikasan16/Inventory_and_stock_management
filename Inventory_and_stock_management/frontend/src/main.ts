import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { AppModule } from './app/app.module';

//prepare the application to runtime to start the application by using AppModule

platformBrowserDynamic()

//start the application by using AppModule
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
