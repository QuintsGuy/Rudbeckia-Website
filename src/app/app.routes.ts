import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LandingComponent } from './components/landing/landing.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { AboutComponent } from './components/about/about.component';
import { ServicesComponent } from './components/services/services.component';
import { ReviewsComponent } from './components/reviews/reviews.component';
import { ContactComponent } from './components/contact/contact.component';
import { LoginComponent } from './components/login/login.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { ManagePortfolioComponent } from './components/admin/manage-portfolio/manage-portfolio.component';
import { ManageReviewsComponent } from './components/admin/manage-reviews/manage-reviews.component';
import { UserManagementComponent } from './components/admin/user-management/user-management.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';

export const routes: Routes = [
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', component: LandingComponent },
            { path: 'portfolio', component: PortfolioComponent },
            { path: 'about', component: AboutComponent },
            { path: 'services', component: ServicesComponent },
            { path: 'reviews', component: ReviewsComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'login', component: LoginComponent },
            { path: 'password-recovery', component: PasswordRecoveryComponent},
        ]
    },
    {
        path: 'admin',
        component: PrivateLayoutComponent,
        canActivateChild: [AdminAuthGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'portfolio', component: ManagePortfolioComponent },
            { path: 'reviews', component: ManageReviewsComponent },
            { path: 'users', component: UserManagementComponent },
        ]
    }
];
