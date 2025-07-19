import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LandingComponent } from './components/public/landing/landing.component';
import { PortfolioComponent } from './components/public/portfolio/portfolio.component';
import { AboutComponent } from './components/public/about/about.component';
import { ServicesComponent } from './components/public/services/services.component';
import { ReviewsComponent } from './components/public/reviews/reviews.component';
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
import { ManageSettingsComponent } from './components/private/manage-settings/manage-settings.component';
import { EventsComponent } from './components/private/events/events.component';
import { PasscodeComponent } from './components/auth/passcode/passcode.component';
import { StripeComponent } from './components/view/stripe/stripe.component';
import { TermsAndConditionsComponent } from './components/public/terms-and-conditions/terms-and-conditions.component';
import { PaymentsComponent } from './components/view/payments/payments.component';
import { PaymentSuccessComponent } from './components/view/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/view/payment-cancel/payment-cancel.component';
import { ManagePaymentsComponent } from './components/private/manage-payments/manage-payments.component';
import { ClientsComponent } from './components/private/clients/clients.component';
import { CoordinatorsComponent } from './components/private/coordinators/coordinators.component';
import { InquiriesComponent } from './components/public/inquiries/inquiries.component';
import { SuccessComponent } from './components/public/inquiries/success/success.component';
import { SubmitReviewComponent } from './components/view/submit-review/submit-review.component';

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
            { path: 'inquiries', component: InquiriesComponent },
            { path: 'password-recovery', component: PasswordRecoveryComponent},
            { path: 'terms-and-conditions', component: TermsAndConditionsComponent},
            { path: 'inquiries/success', component: SuccessComponent},
        ]
    },
    {
        path: 'auth',
        component: PublicLayoutComponent,
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
            { path: 'portfolio', component: ManagePortfolioComponent },
            { path: 'reviews', component: ManageReviewsComponent },
            { path: 'users', component: UserManagementComponent },
            { path: 'settings', component: ManageSettingsComponent },
            { path: 'events', component: EventsComponent },
            { path: 'payments', component: ManagePaymentsComponent },
            { path: 'clients', component: ClientsComponent },
            { path: 'coordinators', component: CoordinatorsComponent },
        ]
    },
    {
        path: 'view',
        component: PublicLayoutComponent,
        children: [
            { path: 'proposal', component: ProposalComponent },
            { path: 'payments', component: PaymentsComponent },
            { path: 'payment-success', component: PaymentSuccessComponent },
            { path: 'payment-cancel', component: PaymentCancelComponent },
            { path: 'stripe', component: StripeComponent },
            { path: 'reviews', component: SubmitReviewComponent },
        ]
    }
];
