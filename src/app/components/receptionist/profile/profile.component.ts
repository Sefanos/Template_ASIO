import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/recepetionist-services/profile.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ProfileComponent implements OnInit {
  readonly defaultPhoto = '/assets/images/pers.jpg';
  user: any = null;
  editedUser: any = {};
  isEditing = false;
  isLoading = false;
  uploadError: string | null = null;
  isPhotoLoading = false;
  uploadSuccess = false;
  timestamp: number = new Date().getTime();
  tempPreviewImage: string | null = null;
  
  // Variables de préchargement d'image
  isImagePreloading: boolean = false;
  preloadSuccess: boolean = false;
  preloadAttemptCount: number = 0;

  isPasswordModalOpen = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  // Informations de débogage
  debugInfo: any = {};

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    // Restaurer la photo stockée localement s'il y en a une
    const storedPhoto = localStorage.getItem('profile_photo');
    if (storedPhoto) {
      this.tempPreviewImage = storedPhoto;
    }
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (data: any) => {
        const userData = data.user || data.data || data;
        
        // Générer un nouveau timestamp pour les requêtes d'images
        this.timestamp = new Date().getTime();
        
        // Si nous avons une image en prévisualisation locale, l'utiliser
        if (this.tempPreviewImage) {
          console.log('Utilisation de la photo en prévisualisation locale');
          
          this.user = {
            id: userData.id,
            name: userData.name || userData.full_name || 'N/A',
            email: userData.email || 'N/A',
            phone: userData.phone || userData.phone_number || 'N/A',
            role: this.extractRole(userData),
            photo: this.tempPreviewImage, // Utiliser la prévisualisation
            created_at: userData.created_at ? new Date(userData.created_at) : null,
            joined_at: userData.joined_at || userData.created_at || null
          };
        } else {
          // Extraire l'URL de la photo avec timestamp anti-cache
          let photoUrl = this.getPhotoUrl(userData);
          
          // Ajouter un timestamp pour éviter le cache du navigateur
          if (photoUrl && photoUrl !== this.defaultPhoto) {
            photoUrl = photoUrl.includes('?') ? 
              photoUrl.split('?')[0] + `?nocache=${this.timestamp}` : 
              `${photoUrl}?nocache=${this.timestamp}`;
          }
          
          this.user = {
            id: userData.id,
            name: userData.name || userData.full_name || 'N/A',
            email: userData.email || 'N/A',
            phone: userData.phone || userData.phone_number || 'N/A',
            role: this.extractRole(userData),
            photo: photoUrl,
            created_at: userData.created_at ? new Date(userData.created_at) : null,
            joined_at: userData.joined_at || userData.created_at || null
          };
        }
        
        // Mettre à jour les données dans le service pour synchronisation
        this.profileService.updateUserName(this.user.name);
        this.profileService.updateUserEmail(this.user.email);
        this.profileService.updateUserRole(this.user.role);
        
        // Ne mettre à jour l'avatar que si nous n'avons pas d'image locale
        if (!this.tempPreviewImage) {
          this.profileService.updateUserAvatar(this.user.photo);
        }
        
        this.editedUser = { ...this.user };
        this.isLoading = false;
        
        // Forcer un rafraîchissement visuel des images
        setTimeout(() => this.refreshImages(), 300);
        
        // Précharger l'image principale si ce n'est pas une Data URL
        if (this.user.photo && !this.user.photo.startsWith('data:')) {
          this.preloadImage(this.user.photo);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        
        // Valeurs par défaut en cas d'erreur
        this.user = {
          name: 'Omar Bennani',
          email: 'omar@gmail.com',
          phone: '0697845124',
          role: 'Réceptionniste',
          photo: this.tempPreviewImage || this.defaultPhoto,
          created_at: new Date(),
        };
        
        // Mettre à jour les données dans le service même en cas d'erreur
        this.profileService.updateUserName(this.user.name);
        this.profileService.updateUserEmail(this.user.email);
        this.profileService.updateUserRole(this.user.role);
        
        // Ne pas écraser l'image locale s'il y en a une
        if (!this.tempPreviewImage) {
          this.profileService.updateUserAvatar(this.user.photo);
        }
        
        this.editedUser = { ...this.user };
        this.isLoading = false;
      }
    });
  }

  private extractRole(userData: any): string {
    if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
      return userData.roles[0].name || 'N/A';
    }
    if (userData.role) {
      return userData.role;
    }
    if (userData.role_name) {
      return userData.role_name;
    }
    return 'Réceptionniste';
  }

  private getPhotoUrl(userData: any): string {
    // Si nous avons une image en prévisualisation locale, l'utiliser
    if (this.tempPreviewImage) {
      return this.tempPreviewImage;
    }
    
    const possibleProps = ['photo', 'profile_image', 'avatar', 'image'];
    for (const prop of possibleProps) {
      if (userData[prop]) {
        const url = userData[prop];
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `http://localhost:8000${url}`;
      }
    }
    return this.defaultPhoto;
  }

  openEditModal() {
    if (this.user) {
      this.isEditing = true;
      this.editedUser = { ...this.user };
    }
  }

  closeEditModal() {
    this.isEditing = false;
  }

  saveChanges() {
    // Validation basique
    if (!this.editedUser.name || !this.editedUser.email) {
      alert('Le nom et l\'email sont obligatoires');
      return;
    }
    
    // Extraire uniquement les champs nécessaires
    const updatedData = {
      id: this.editedUser.id,
      name: this.editedUser.name,
      email: this.editedUser.email,
      phone: this.editedUser.phone || ''
    };
    
    this.isLoading = true;
    
    this.profileService.updateProfile(updatedData).subscribe({
      next: (response) => {
        // Mettre à jour l'objet user avec les nouvelles valeurs
        this.user = { 
          ...this.user,
          name: this.editedUser.name,
          email: this.editedUser.email,
          phone: this.editedUser.phone
        };
        
        // Mettre à jour les données dans le service pour synchronisation avec le layout
        this.profileService.updateUserName(this.user.name);
        this.profileService.updateUserEmail(this.user.email);
        if (this.user.phone) this.profileService.updateUserPhone(this.user.phone);
        
        this.closeEditModal();
        alert('Profil mis à jour avec succès');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        
        let errorMessage = 'Erreur lors de la mise à jour du profil';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.errors) {
          const errors = Object.values(err.error.errors).flat();
          errorMessage = Array.isArray(errors) ? errors.join('\n') : String(errors);
        }
        
        // Malgré l'erreur, mettre à jour l'interface pour une meilleure expérience utilisateur
        this.user = { 
          ...this.user,
          name: this.editedUser.name,
          email: this.editedUser.email,
          phone: this.editedUser.phone
        };
        
        // Mettre à jour les données dans le service même en cas d'erreur API
        this.profileService.updateUserName(this.user.name);
        this.profileService.updateUserEmail(this.user.email);
        if (this.user.phone) this.profileService.updateUserPhone(this.user.phone);
        
        alert(errorMessage);
        this.closeEditModal();
        this.isLoading = false;
      }
    });
  }

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    this.isLoading = true;
    
    this.profileService.changePassword({
      current_password: this.currentPassword,
      password: this.newPassword,
      password_confirmation: this.confirmPassword
    }).subscribe({
      next: () => {
        alert('Mot de passe changé avec succès !');
        this.closePasswordModal();
        this.isLoading = false;
      },
      error: (err) => {
        let errorMessage = 'Erreur lors du changement de mot de passe';
        
        if (err.error?.message) {
          errorMessage = 'Erreur: ' + err.error.message;
        } else if (err.error?.errors) {
          const errorMessages = Object.values(err.error.errors).flat().join('\n');
          errorMessage = 'Erreurs de validation:\n' + errorMessages;
        }
        
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      alert('L\'image ne doit pas dépasser 2MB.');
      return;
    }

    this.isLoading = true;
    this.isPhotoLoading = true;
    this.uploadError = null;
    this.uploadSuccess = false;
    
    // Mettre à jour les informations de débogage
    this.debugInfo = {
      startTime: new Date().toISOString(),
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    };

    // Solution hybride : prévisualisation locale + upload serveur
    this.profileService.updateProfilePhoto(file).subscribe({
      next: (response) => {
        console.log('Réponse upload photo:', response);
        this.debugInfo.response = response;
        this.debugInfo.endTime = new Date().toISOString();
        
        // Toujours utiliser la prévisualisation pour l'affichage immédiat
        if (response.previewUrl) {
          this.tempPreviewImage = response.previewUrl;
          this.user.photo = response.previewUrl;
        }
        
        // Si l'upload serveur a réussi, stocker également l'URL serveur
        if (response.serverSync && response.imageUrl) {
          console.log('Image synchronisée avec le serveur:', response.imageUrl);
          
          // Précharger l'image du serveur
          this.preloadImage(response.imageUrl);
        }
        
        // Mettre à jour les statuts
        this.isPhotoLoading = false;
        this.isLoading = false;
        this.uploadSuccess = true;
        this.uploadError = response.message && response.message.includes("n'a pas pu être sauvegardée") ? 
          response.message : null;
        
        // Rafraîchir les images dans l'interface
        this.refreshImages();
      },
      error: (error) => {
        console.error('Erreur lors de l\'upload:', error);
        this.debugInfo.error = error;
        this.debugInfo.errorTime = new Date().toISOString();
        
        this.isPhotoLoading = false;
        this.isLoading = false;
        this.uploadError = "Impossible de mettre à jour la photo. Veuillez réessayer plus tard.";
      }
    });
  }

  // Méthode pour rafraîchir les images
  refreshImages() {
    console.log('Rafraîchissement des images...');
    this.timestamp = new Date().getTime();
    
    // Rafraîchir l'image principale du profil uniquement si ce n'est pas une prévisualisation
    if (this.user && this.user.photo && this.user.photo !== this.defaultPhoto && !this.user.photo.startsWith('data:')) {
      if (this.user.photo.includes('?')) {
        this.user.photo = this.user.photo.split('?')[0] + `?nocache=${this.timestamp}`;
      } else {
        this.user.photo = `${this.user.photo}?nocache=${this.timestamp}`;
      }
      console.log('Image de profil actualisée:', this.user.photo);
    }
    
    // Mettre à jour l'image dans le service si ce n'est pas une prévisualisation
    if (!this.tempPreviewImage || !this.user.photo.startsWith('data:')) {
      this.profileService.updateUserAvatar(this.user.photo);
    }
    
    // Sélectionner toutes les images du serveur dans la page
    const images = document.querySelectorAll('img[src*="localhost:8000"]');
    console.log(`${images.length} images trouvées à rafraîchir`);
    
    // Ajouter un paramètre de cache-busting à chaque image
    images.forEach((img, index) => {
      const element = img as HTMLImageElement;
      const currentSrc = element.src;
      
      if (!currentSrc.startsWith('data:')) {
        const timestamp = this.timestamp + index;
        
        // Construire la nouvelle URL avec timestamp
        if (currentSrc.includes('?')) {
          element.src = currentSrc.split('?')[0] + `?nocache=${timestamp}`;
        } else {
          element.src = currentSrc + `?nocache=${timestamp}`;
        }
        
        // Forcer un rechargement de l'image
        element.onload = () => console.log(`Image ${index + 1} rechargée avec succès`);
        element.onerror = () => {
          console.error(`Erreur de chargement pour l'image ${index + 1}`);
          // Appliquer l'image par défaut en cas d'erreur
          element.src = this.defaultPhoto;
        };
      }
    });
  }

  onImageError(event: any) {
    console.log('Erreur de chargement d\'image, utilisation de l\'image par défaut');
    
    // Si nous avons une prévisualisation, l'utiliser
    if (this.tempPreviewImage) {
      event.target.src = this.tempPreviewImage;
    } else {
      // Sinon, utiliser l'image par défaut
      event.target.src = this.defaultPhoto;
    }
  }

  /**
   * Méthode appelée quand l'image préchargée est chargée avec succès
   */
  onImagePreloaded() {
    console.log('Image préchargée avec succès');
    this.preloadSuccess = true;
    this.preloadAttemptCount++;
    
    // Si c'était une tentative pour résoudre une erreur d'affichage, rafraîchir les images visibles
    if (this.uploadError) {
      setTimeout(() => this.refreshImages(), 300);
    }
  }

  /**
   * Méthode appelée quand l'image préchargée échoue à se charger
   */
  onImagePreloadError() {
    console.log('Erreur lors du préchargement de l\'image');
    this.preloadSuccess = false;
    this.preloadAttemptCount++;
    
    // Essayer une alternative si l'image ne se charge pas
    this.tryAlternativeImagePaths();
  }

  /**
   * Tente de précharger une image pour vérifier son accessibilité
   */
  private preloadImage(url: string) {
    if (!url || url.startsWith('data:') || url === this.defaultPhoto) return;
    
    console.log('Préchargement de l\'image:', url);
    this.isImagePreloading = true;
    
    const img = new Image();
    img.onload = () => {
      console.log('Image préchargée avec succès:', url);
      this.isImagePreloading = false;
      this.preloadSuccess = true;
      
      // Utiliser cette image vérifiée si elle est différente de l'actuelle
      if (this.user && this.user.photo && this.user.photo !== url) {
        console.log('Utilisation de l\'URL validée:', url);
        const timestampedUrl = url.includes('?') ? 
          url.split('?')[0] + `?nocache=${this.timestamp}` : 
          `${url}?nocache=${this.timestamp}`;
        this.user.photo = timestampedUrl;
        this.profileService.updateUserAvatar(timestampedUrl);
      }
    };
    
    img.onerror = () => {
      console.error('Erreur lors du préchargement de l\'image:', url);
      this.isImagePreloading = false;
      this.preloadSuccess = false;
      
      // Si c'était l'image actuelle, et nous avons une prévisualisation, l'utiliser
      if (this.user && this.user.photo === url && this.tempPreviewImage) {
        console.log('Fallback vers la prévisualisation locale');
        this.user.photo = this.tempPreviewImage;
        this.profileService.updateUserAvatar(this.tempPreviewImage);
      }
    };
    
    // Démarrer le chargement
    img.src = url.includes('?') ? url : url + `?cache=${new Date().getTime()}`;
  }

  /**
   * Essaie différents chemins d'image alternatives en cas d'échec
   */
  private tryAlternativeImagePaths() {
    if (!this.user || !this.user.photo || this.user.photo.startsWith('data:')) return;
    
    const originalUrl = this.user.photo.split('?')[0]; // URL sans paramètres
    const fileName = originalUrl.split('/').pop();
    
    if (!fileName) return;
    
    const alternativePaths = [
      `http://localhost:8000/storage/${fileName}`,
      `http://localhost:8000/uploads/${fileName}`,
      `http://localhost:8000/images/${fileName}`,
      `http://localhost:8000/storage/app/public/${fileName}`,
      `http://localhost:8000/public/storage/${fileName}`
    ];
    
    console.log('Tentative avec chemins alternatifs pour:', fileName);
    
    // Essayer chaque chemin alternatif
    alternativePaths.forEach((path, index) => {
      setTimeout(() => {
        this.preloadImage(path);
      }, index * 1000); // Espacer les tentatives
    });
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }
  
  /**
 * Méthode pour forcer l'actualisation de l'image en cas de problème
 */
forceRefreshImage() {
  console.log('Actualisation forcée de l\'image');
  
  // Mettre à jour l'interface utilisateur pour indiquer le rechargement
  const prevError = this.uploadError;
  this.uploadError = "Tentative d'actualisation de l'image...";
  this.isPhotoLoading = true;
  
  // Si nous avons sauvegardé le fichier d'image localement
  const lastUploadedFile = this.profileService.getLastUploadedPhotoFile();
  
  if (lastUploadedFile) {
    console.log('Réessai d\'upload du fichier image précédent');
    
    // Réessayer l'upload avec le fichier original
    this.profileService.retryUploadPhoto(lastUploadedFile).subscribe({
      next: (response) => {
        this.isPhotoLoading = false;
        
        if (response.success) {
          console.log('Réupload réussi:', response);
          this.uploadError = null;
          this.uploadSuccess = true;
          
          // Mettre à jour l'URL si nous en avons reçu une nouvelle
          if (response.imageUrl) {
            const newImageUrl = response.imageUrl.includes('?') ? 
              response.imageUrl : 
              `${response.imageUrl}?nocache=${new Date().getTime()}`;
            
            this.user.photo = newImageUrl;
            this.profileService.updateUserAvatar(newImageUrl);
          }
          
          // Rafraîchir toutes les images
          setTimeout(() => this.refreshImages(), 300);
        } else {
          console.log('Échec du réupload:', response);
          this.uploadError = "L'image n'a toujours pas pu être sauvegardée sur le serveur. Veuillez réessayer plus tard.";
          
          // Garder l'image locale
          if (this.tempPreviewImage) {
            this.user.photo = this.tempPreviewImage;
            this.profileService.updateUserAvatar(this.tempPreviewImage);
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors de la retentative d\'upload:', err);
        this.isPhotoLoading = false;
        this.uploadError = prevError || "Échec lors de la tentative d'actualisation. Veuillez réessayer plus tard.";
      }
    });
  } else {
    // Si nous n'avons pas le fichier original, essayer de rafraîchir l'affichage
    console.log('Pas de fichier original disponible, tentative de rafraîchissement d\'affichage');
    
    // Générer un nouveau timestamp
    this.timestamp = new Date().getTime();
    
    // Si nous avons une prévisualisation locale, l'appliquer
    if (this.tempPreviewImage) {
      this.user.photo = this.tempPreviewImage;
      this.profileService.updateUserAvatar(this.tempPreviewImage);
      setTimeout(() => {
        this.isPhotoLoading = false;
        this.uploadError = null;
        this.uploadSuccess = true;
      }, 1000);
    } else {
      // Forcer un rafraîchissement de toutes les images
      this.refreshImages();
      
      // Si nous avons une URL serveur
      if (this.user && this.user.photo && !this.user.photo.startsWith('data:')) {
        // Précharger l'image avec une nouvelle tentative
        this.preloadImage(this.user.photo.split('?')[0]);
        
        // Essayer des chemins alternatifs
        this.tryAlternativeImagePaths();
      }
      
      // Recharger le profil en arrière-plan
      this.profileService.getProfile().subscribe({
        next: (data) => {
          console.log('Profil rechargé après actualisation forcée');
          this.isPhotoLoading = false;
          
          // Mettre à jour l'URL de l'image si disponible
          if (data && data.user && data.user.photo) {
            const newImageUrl = data.user.photo.includes('?') ?
              data.user.photo :
              `${data.user.photo}?nocache=${this.timestamp}`;
            
            this.user.photo = newImageUrl;
            this.profileService.updateUserAvatar(newImageUrl);
            this.uploadError = null;
            this.uploadSuccess = true;
          } else {
            this.uploadError = prevError;
          }
        },
        error: () => {
          console.error('Échec du rechargement du profil après actualisation forcée');
          this.isPhotoLoading = false;
          this.uploadError = prevError || "Échec lors de la tentative d'actualisation";
        }
      });
    }
  }
}
}