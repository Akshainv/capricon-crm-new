import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class SessionTimeoutService implements OnDestroy {
    private timeoutMs = 4 * 60 * 60 * 1000; // 4 hours
    private timeoutId: any = null;
    private readonly activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    constructor(
        private authService: AuthService,
        private router: Router,
        private toastr: ToastrService,
        private ngZone: NgZone
    ) {
        // Start monitoring when the service is created
        this.startMonitoring();
    }

    private startMonitoring(): void {
        // Run outside Angular zone to avoid triggering change detection on every mouse move
        this.ngZone.runOutsideAngular(() => {
            this.activityEvents.forEach(event => {
                window.addEventListener(event, this.onActivity);
            });
        });

        // Start the initial timer if logged in
        if (this.authService.isLoggedIn) {
            this.resetTimer();
        }
    }

    private onActivity = (): void => {
        if (this.authService.isLoggedIn) {
            this.resetTimer();
        }
    };

    private resetTimer(): void {
        // Clear existing timer
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Set new timer
        this.timeoutId = setTimeout(() => {
            this.onSessionTimeout();
        }, this.timeoutMs);
    }

    private onSessionTimeout(): void {
        if (!this.authService.isLoggedIn) {
            return;
        }

        // Run inside Angular zone so UI updates properly
        this.ngZone.run(() => {
            this.authService.logout();
            this.toastr.warning(
                'Your session has expired due to inactivity. Please log in again.',
                'Session Expired',
                { timeOut: 5000 }
            );
        });
    }

    ngOnDestroy(): void {
        // Clean up
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.activityEvents.forEach(event => {
            window.removeEventListener(event, this.onActivity);
        });
    }
}
