import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LandingComponent } from './components/public/landing/landing.component';
import { PortfolioComponent } from './components/public/portfolio/portfolio.component';
import { AboutComponent } from './components/public/about/about.component';
import { ServicesComponent } from './components/public/services/services.component';
import { ReviewsComponent } from './components/public/reviews/reviews.component';
import { ContactComponent } from './components/public/contact/contact.component';
import { LoginComponent } from './components/auth/login/login.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { DashboardComponent } from './components/private/dashboard/dashboard.component';
import { ManagePortfolioComponent } from './components/private/manage-portfolio/manage-portfolio.component';
import { ManageReviewsComponent } from './components/private/manage-reviews/manage-reviews.component';
import { UserManagementComponent } from './components/private/user-management/user-management.component';
import { PasswordRecoveryComponent } from './components/auth/password-recovery/password-recovery.component';
import { CalendarComponent } from './components/private/calendar/calendar.component';
import { ProposalComponent } from './components/view/proposals/proposal.component';
import { ManageAboutComponent } from './components/private/manage-about/manage-about.component';
import { ManageServicesComponent } from './components/private/manage-services/manage-services.component';
import { InboxComponent } from './components/private/inbox/inbox.component';
import { ManageSettingsComponent } from './components/private/manage-settings/manage-settings.component';
import { EventsComponent } from './components/private/events/events.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { PasscodeComponent } from './components/auth/passcode/passcode.component';
import { StripeComponent } from './components/view/stripe/stripe.component';
import { TermsAndConditionsComponent } from './components/public/terms-and-conditions/terms-and-conditions.component';
import { PaymentsComponent } from './components/view/payments/payments.component';
import { PaymentSuccessComponent } from './components/view/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/view/payment-cancel/payment-cancel.component';
import { ManagePaymentsComponent } from './components/private/manage-payments/manage-payments.component';

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
            { path: 'password-recovery', component: PasswordRecoveryComponent},
            { path: 'terms-and-conditions', component: TermsAndConditionsComponent},
        ]
    },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
            { path: 'login', component: LoginComponent },
            { path: 'password-recovery', component: PasswordRecoveryComponent },
            { path: 'passcode', component: PasscodeComponent },
        ]
    },
    {
        path: 'private',
        component: PrivateLayoutComponent,
        canActivateChild: [AdminAuthGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'calendar', component: CalendarComponent },
            { path: 'about', component: ManageAboutComponent },
            { path: 'portfolio', component: ManagePortfolioComponent },
            { path: 'reviews', component: ManageReviewsComponent },
            { path: 'services', component: ManageServicesComponent },
            { path: 'users', component: UserManagementComponent },
            { path: 'inbox', component: InboxComponent },
            { path: 'settings', component: ManageSettingsComponent },
            { path: 'events', component: EventsComponent },
            { path: 'payments', component: ManagePaymentsComponent },
        ]
    },
    {
        path: 'view',
        component: AuthLayoutComponent,
        children: [
            { path: 'proposal', component: ProposalComponent },
            { path: 'payments', component: PaymentsComponent },
            { path: 'payment-success', component: PaymentSuccessComponent },
            { path: 'payment-cancel', component: PaymentCancelComponent },
            { path: 'stripe', component: StripeComponent },
        ]
    }
];
