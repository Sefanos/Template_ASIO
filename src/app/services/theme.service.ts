import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkMode.asObservable();

  constructor() {
    // Forcer le mode clair
    this.darkMode.next(false);
    localStorage.setItem('theme', 'light');
    this.applyTheme();
  }

  toggleDarkMode(): void {
    // Ne rien faire - mode sombre désactivé
    this.darkMode.next(false);
    localStorage.setItem('theme', 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    // Toujours s'assurer que le mode sombre est désactivé
    document.documentElement.classList.remove('dark');
  }
}
