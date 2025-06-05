import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastSubject.asObservable();
  private toastId = 0;

  private showToast(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: ++this.toastId,
      duration: toast.duration || 4000
    };

    const currentToasts = this.toastSubject.value;
    this.toastSubject.next([...currentToasts, newToast]);

    // Auto remove toast after duration
    setTimeout(() => {
      this.removeToast(newToast.id);
    }, newToast.duration);
  }

  success(title: string, message?: string, duration?: number): void {
    this.showToast({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number): void {
    this.showToast({ type: 'error', title, message, duration });
  }

  info(title: string, message?: string, duration?: number): void {
    this.showToast({ type: 'info', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.showToast({ type: 'warning', title, message, duration });
  }

  removeToast(id: number): void {
    const currentToasts = this.toastSubject.value;
    this.toastSubject.next(currentToasts.filter(toast => toast.id !== id));
  }
}
