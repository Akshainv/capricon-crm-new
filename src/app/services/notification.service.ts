import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, interval } from 'rxjs';
import { map, switchMap, catchError, tap, startWith } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Notification {
    _id: string;
    icon: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    actionLink?: string;
    userId: string;
    leadId?: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiBaseUrl}/notifications`;

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private pollingSubscription: any;
    private currentPollingUserId: string | null = null;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        // Start/Stop/Restart polling based on login status and user identity
        this.authService.currentUser.subscribe(user => {
            if (user && user.userId) {
                // If user changed (different userId), restart polling with new identity
                if (this.currentPollingUserId !== user.userId) {
                    this.stopPolling();
                    this.currentPollingUserId = user.userId;
                    this.startPolling();
                }
            } else {
                this.currentPollingUserId = null;
                this.stopPolling();
            }
        });
    }

    startPolling() {
        if (this.pollingSubscription) return;

        // Poll every 5 seconds
        this.pollingSubscription = interval(5000).pipe(
            startWith(0),
            switchMap(() => this.getUnreadNotifications()),
            catchError(err => {
                console.error('Error in notification polling:', err);
                return []; // Prevent subscription from dying
            })
        ).subscribe(notifications => {
            this.notificationsSubject.next(notifications);
            this.unreadCountSubject.next(notifications.length);
        });
    }

    stopPolling() {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = null;
        }
        this.unreadCountSubject.next(0);
        this.notificationsSubject.next([]);
    }

    getUnreadNotifications(): Observable<Notification[]> {
        const user = this.authService.currentUserValue;
        if (!user) return new Observable(obs => obs.next([]));

        const timestamp = new Date().getTime();
        return this.http.get<any>(`${this.apiUrl}/user/${user.userId}/unread?t=${timestamp}`).pipe(
            tap(res => console.log('🔔 Frontend: Received notifications response:', res)),
            map(res => res.data || [])
        );
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/mark-read`, {}).pipe(
            tap(() => {
                const current = this.notificationsSubject.value;
                const updated = current.filter(n => n._id !== id);
                this.notificationsSubject.next(updated);
                this.unreadCountSubject.next(updated.length);
            })
        );
    }

    markAllAsRead(): Observable<any> {
        const user = this.authService.currentUserValue;
        if (!user) return new Observable();

        return this.http.patch(`${this.apiUrl}/user/${user.userId}/mark-all-read`, {}).pipe(
            tap(() => {
                this.notificationsSubject.next([]);
                this.unreadCountSubject.next(0);
            })
        );
    }
}
