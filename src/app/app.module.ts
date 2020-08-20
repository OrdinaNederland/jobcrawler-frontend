import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConvertStringToDotsPipe } from './utils/convert-string-to-dots.pipe';
import { MaterialModule } from './material/material.module';
import { VacancyTableComponent } from './components/vacancy-table/vacancy-table.component';
import { FilterComponent } from './components/filter/filter.component';
import { VacancyDialogComponent } from './components/vacancy-dialog/vacancy-dialog.component';
import { LoaderService } from './services/loader.service';
import { LoaderInterceptor } from './interceptors/loader.interceptor';
import { SkillListComponent } from 'src/app/components/skill-list/skill-list.component';
import { SkillFormComponent } from './components/skill-form/skill-form.component';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';


@NgModule({
    declarations: [
        AppComponent,
        ConvertStringToDotsPipe,
        VacancyTableComponent,
        FilterComponent,
        VacancyDialogComponent,
        SkillListComponent,
        SkillFormComponent,
        LoginDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        MaterialModule
    ],
    providers: [
        LoaderService,
        { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
    ],
    bootstrap: [AppComponent],
    entryComponents: [VacancyDialogComponent]
})
export class AppModule {
}
