import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: User;
  data?: User;
  message?: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  previewUrl?: string;
  serverSync: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8000/api';
  
  // BehaviorSubjects pour la synchronisation en temps réel avec le layout
  private userNameSubject = new BehaviorSubject<string>('');
  private userEmailSubject = new BehaviorSubject<string>('');
  private userRoleSubject = new BehaviorSubject<string>('');
  private userAvatarSubject = new BehaviorSubject<string>('');
  private userPhoneSubject = new BehaviorSubject<string>('');
  
  // Observables publics pour les composants
  public userName$ = this.userNameSubject.asObservable();
  public userEmail$ = this.userEmailSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();
  public userAvatar$ = this.userAvatarSubject.asObservable();
  public userPhone$ = this.userPhoneSubject.asObservable();

  // Cache pour le dernier fichier uploadé (pour les tentatives de réupload)
  private lastUploadedFile: File | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Récupère le profil de l'utilisateur connecté
   * Utilise: GET /api/auth/me
   */
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/auth/me`).pipe(
      map(response => {
        // Standardiser la réponse
        if (response.success && (response.user || response.data)) {
          const userData = response.user || response.data;
          return {
            success: true,
            user: userData,
            data: userData
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération du profil:', error);
        return of({
          success: false,
          message: 'Erreur lors du chargement du profil'
        });
      })
    );
  }

  /**
   * Met à jour les informations du profil pour un RÉCEPTIONNISTE
   * Utilise: PUT /api/users/{id} (depuis la route apiResource users)
   */
  updateProfile(userData: Partial<User>): Observable<any> {
    // D'abord récupérer l'ID de l'utilisateur connecté
    return this.getProfile().pipe(
      switchMap(profileResponse => {
        const userId = profileResponse.user?.id || profileResponse.data?.id;
        
        if (!userId) {
          throw new Error('Impossible de récupérer l\'ID utilisateur');
        }

        const updateData = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        };

        // Utiliser PUT /api/users/{id} depuis l'apiResource
        return this.http.put(`${this.apiUrl}/users/${userId}`, updateData);
      }),
      map(response => {
        // Mettre à jour les BehaviorSubjects avec les nouvelles données
        if (userData.name) this.updateUserName(userData.name);
        if (userData.email) this.updateUserEmail(userData.email);
        if (userData.phone) this.updateUserPhone(userData.phone);
        
        return response;
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        throw error;
      })
    );
  }

  /**
   * Change le mot de passe de l'utilisateur
   * Utilise: POST /api/auth/change-password
   */
  changePassword(passwordData: PasswordChangeRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, passwordData).pipe(
      catchError(error => {
        console.error('Erreur lors du changement de mot de passe:', error);
        throw error;
      })
    );
  }

  /**
   * Upload d'une nouvelle photo de profil pour un RÉCEPTIONNISTE
   * Note: Il n'y a pas d'endpoint spécifique pour l'upload d'image dans api.php
   * Donc on utilise une stratégie de fallback avec prévisualisation locale
   */
  updateProfilePhoto(file: File): Observable<PhotoUploadResponse> {
    // Sauvegarder le fichier pour les éventuelles tentatives de réupload
    this.lastUploadedFile = file;

    // Créer une prévisualisation locale immédiate
    const reader = new FileReader();
    const previewPromise = new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return new Observable<PhotoUploadResponse>(observer => {
      // D'abord créer la prévisualisation
      previewPromise.then(previewUrl => {
        // Stocker la prévisualisation localement
        localStorage.setItem('profile_photo', previewUrl);
        
        // Envoyer la réponse avec prévisualisation immédiate
        const immediateResponse: PhotoUploadResponse = {
          success: true,
          message: "Photo mise à jour localement (pas d'endpoint serveur disponible)",
          previewUrl: previewUrl,
          serverSync: false
        };

        observer.next(immediateResponse);

        // Essayer quelques endpoints possibles qui pourraient exister
        this.tryPhotoUploadEndpoints(file, previewUrl, observer);
      });
    });
  }

  /**
   * Essaie différents endpoints possibles pour l'upload de photo
   * Même si aucun n'est défini dans api.php, on teste au cas où
   */
  private tryPhotoUploadEndpoints(file: File, previewUrl: string, observer: any): void {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('photo', file);

    // Récupérer l'ID utilisateur pour construire les endpoints
    this.getProfile().subscribe({
      next: (profileResponse) => {
        const userId = profileResponse.user?.id || profileResponse.data?.id;
        
        if (!userId) {
          observer.next({
            success: true,
            message: "Photo mise à jour localement (ID utilisateur non disponible)",
            previewUrl: previewUrl,
            serverSync: false
          });
          observer.complete();
          return;
        }

        // Liste des endpoints possibles à essayer (même s'ils n'existent pas dans api.php)
        const possibleEndpoints = [
          `/users/${userId}/photo`,
          `/users/${userId}/avatar`,
          `/users/${userId}/image`,
          `/auth/upload-photo`,
          `/profile/photo`
        ];

        let attemptIndex = 0;

        const tryNextEndpoint = () => {
          if (attemptIndex >= possibleEndpoints.length) {
            // Tous les endpoints ont échoué - ce qui est normal car ils n'existent pas
            observer.next({
              success: true,
              message: "Photo mise à jour localement (aucun endpoint serveur trouvé)",
              previewUrl: previewUrl,
              serverSync: false
            });
            observer.complete();
            return;
          }

          const endpoint = possibleEndpoints[attemptIndex];
          attemptIndex++;

          this.http.post<any>(`${this.apiUrl}${endpoint}`, formData).subscribe({
            next: (response) => {
              console.log(`Upload réussi avec l'endpoint ${endpoint}:`, response);
              
              if (response.success) {
                localStorage.removeItem('profile_photo');
                
                if (response.data?.photo || response.photo || response.imageUrl) {
                  const imageUrl = response.data?.photo || response.photo || response.imageUrl;
                  this.updateUserAvatar(imageUrl);
                  
                  observer.next({
                    success: true,
                    message: "Photo mise à jour avec succès sur le serveur",
                    imageUrl: imageUrl,
                    previewUrl: previewUrl,
                    serverSync: true
                  });
                } else {
                  observer.next({
                    success: true,
                    message: "Photo mise à jour avec succès (serveur)",
                    previewUrl: previewUrl,
                    serverSync: true
                  });
                }
                
                observer.complete();
              } else {
                tryNextEndpoint();
              }
            },
            error: () => {
              console.log(`Échec avec l'endpoint ${endpoint}, essai suivant...`);
              tryNextEndpoint();
            }
          });
        };

        tryNextEndpoint();
      },
      error: () => {
        observer.next({
          success: true,
          message: "Photo mise à jour localement (erreur profil)",
          previewUrl: previewUrl,
          serverSync: false
        });
        observer.complete();
      }
    });
  }

  /**
   * Réessaye l'upload d'une photo précédemment uploadée
   */
  retryUploadPhoto(file: File): Observable<PhotoUploadResponse> {
    if (!file && this.lastUploadedFile) {
      file = this.lastUploadedFile;
    }

    if (!file) {
      return of({
        success: false,
        message: "Aucun fichier à réuploader",
        serverSync: false
      });
    }

    return this.updateProfilePhoto(file);
  }

  /**
   * Récupère le dernier fichier uploadé (pour les tentatives de réupload)
   */
  getLastUploadedPhotoFile(): File | null {
    return this.lastUploadedFile;
  }

  // =====================================
  // MÉTHODES DE MISE À JOUR DES DONNÉES
  // =====================================

  updateUserName(name: string): void {
    this.userNameSubject.next(name);
  }

  updateUserEmail(email: string): void {
    this.userEmailSubject.next(email);
  }

  updateUserRole(role: string): void {
    this.userRoleSubject.next(role);
  }

  updateUserAvatar(avatar: string): void {
    this.userAvatarSubject.next(avatar);
  }

  updateUserPhone(phone: string): void {
    this.userPhoneSubject.next(phone);
  }

  // =====================================
  // MÉTHODES D'ACCÈS AUX DONNÉES ACTUELLES
  // =====================================

  getCurrentUserName(): string {
    return this.userNameSubject.value;
  }

  getCurrentUserEmail(): string {
    return this.userEmailSubject.value;
  }

  getCurrentUserRole(): string {
    return this.userRoleSubject.value;
  }

  getCurrentUserAvatar(): string {
    return this.userAvatarSubject.value;
  }

  getCurrentUserPhone(): string {
    return this.userPhoneSubject.value;
  }

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

  clearImageCache(): void {
    localStorage.removeItem('profile_photo');
    this.lastUploadedFile = null;
  }

  resetUserData(): void {
    this.userNameSubject.next('');
    this.userEmailSubject.next('');
    this.userRoleSubject.next('');
    this.userAvatarSubject.next('');
    this.userPhoneSubject.next('');
    this.clearImageCache();
  }

  hasLocalImageCache(): boolean {
    return localStorage.getItem('profile_photo') !== null;
  }

  getLocalImageCache(): string | null {
    return localStorage.getItem('profile_photo');
  }
}