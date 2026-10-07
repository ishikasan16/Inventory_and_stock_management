import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { SessionService, sessionInitFactory } from './services/session.service';

@NgModule({
  declarations: [AppComponent],
  //tells i need functionality provided by these modules
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // Rebuilds the session from the refresh cookie before the app renders, so a
    // reload that lands after the access token expired does not get bounced to
    // the login page.
    {
      provide: APP_INITIALIZER,
      useFactory: sessionInitFactory,
      deps: [SessionService],
      multi: true
    }
  ],

  //tells angular this is the first component to load when the application starts
  bootstrap: [AppComponent]
})
export class AppModule {
}
