import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

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
    private apiUrl = 'http://localhost:3000/notifications';

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private pollingSubscription: any;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        // Start/Stop polling based on login status
        this.authService.currentUser.subscribe(user => {
            if (user) {
                this.startPolling();
            } else {
                this.stopPolling();
            }
        });
    }

    startPolling() {
        if (this.pollingSubscription) return;

        // Poll every 30 seconds
        this.pollingSubscription = timer(0, 30000).pipe(
            switchMap(() => this.getUnreadNotifications()),
            tap(notifications => {
                this.notificationsSubject.next(notifications);
                this.unreadCountSubject.next(notifications.length);
            }),
            catchError(err => {
                console.error('Error polling notifications:', err);
                return [];
            })
        ).subscribe();
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

        return this.http.get<any>(`${this.apiUrl}/user/${user.userId}/unread`).pipe(
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
