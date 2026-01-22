import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private isVisibleSubject = new BehaviorSubject<boolean>(false);
    private messageSubject = new BehaviorSubject<string>('');
    private titleSubject = new BehaviorSubject<string>('Obaveštenje');
    private isConfirmSubject = new BehaviorSubject<boolean>(false);
    private confirmResponseSubject = new Subject<boolean>();

    public isVisible$ = this.isVisibleSubject.asObservable();
    public message$ = this.messageSubject.asObservable();
    public title$ = this.titleSubject.asObservable();
    public isConfirm$ = this.isConfirmSubject.asObservable();
    public confirmResponse$ = this.confirmResponseSubject.asObservable();

    show(message: string, title: string = 'Obaveštenje'): void {
        this.messageSubject.next(message);
        this.titleSubject.next(title);
        this.isConfirmSubject.next(false);
        this.isVisibleSubject.next(true);
    }

    confirm(message: string, title: string = 'Potvrda'): Promise<boolean> {
        this.messageSubject.next(message);
        this.titleSubject.next(title);
        this.isConfirmSubject.next(true);
        this.isVisibleSubject.next(true);

        return new Promise((resolve) => {
            const subscription = this.confirmResponseSubject.subscribe((response) => {
                resolve(response);
                subscription.unsubscribe();
            });
        });
    }

    close(): void {
        this.isVisibleSubject.next(false);
    }

    respond(confirmed: boolean): void {
        this.confirmResponseSubject.next(confirmed);
        this.close();
    }
}
