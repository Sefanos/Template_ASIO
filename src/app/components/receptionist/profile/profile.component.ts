import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  isEditing: boolean = false;

  isPasswordModalOpen = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    console.log('🔍 Chargement du profil...');
    this.http.get('http://localhost:8000/api/profile').subscribe({
      next: (data: any) => {
        console.log('✅ Données reçues:', data);
        this.user = {
          name: data?.name || 'N/A',
          email: data?.email || 'N/A',
          phone: data?.phone || 'N/A',
          role: data?.role || 'N/A',
          photo: data?.photo || this.defaultPhoto,
          joinDate: data?.joinDate ? new Date(data.joinDate) : null,
        };
        console.log('👤 User final:', this.user);
        this.editedUser = { ...this.user };
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement du profil:', err);
        this.user = {
          name: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          role: 'N/A',
          photo: this.defaultPhoto,
          joinDate: null,
        };
        this.editedUser = { ...this.user };
      }
    });
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
    this.http.put('http://localhost:8000/api/profile', this.editedUser).subscribe({
      next: () => {
        this.user = { ...this.editedUser };
        this.closeEditModal();
        alert('Profil mis à jour avec succès');
      },
      error: () => alert('Erreur lors de la mise à jour du profil')
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

    this.http.put('http://localhost:8000/api/profile/password', { 
      newPassword: this.newPassword 
    }).subscribe({
      next: () => {
        alert('Mot de passe changé avec succès !');
        this.closePasswordModal();
      },
      error: () => alert('Erreur lors du changement de mot de passe')
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // ✅ Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      alert('L\'image ne doit pas dépasser 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    console.log('📤 Upload de la photo en cours...');

    this.http.post('http://localhost:8000/api/profile/photo', formData).subscribe({
      next: (response: any) => {
        console.log('✅ Réponse upload photo:', response);
        
        if (response.photo) {
          // ✅ Mettre à jour immédiatement la photo avec timestamp pour éviter le cache
          const timestamp = new Date().getTime();
          this.user.photo = response.photo + '?t=' + timestamp;
          
          console.log('📸 Nouvelle photo URL:', this.user.photo);
          alert('Photo de profil mise à jour avec succès !');
        }
      },
      error: (err) => {
        console.error('❌ Erreur upload photo:', err);
        alert('Erreur lors du changement de photo');
      }
    });
  }

  // ✅ Gérer les erreurs d'image
  onImageError(event: any) {
    console.log('❌ Erreur de chargement d\'image:', event.target.src);
    event.target.src = this.defaultPhoto;
  }

  // ✅ Confirmer le chargement de l'image
  onImageLoad(event: any) {
    console.log('✅ Image chargée avec succès:', event.target.src);
  }
}