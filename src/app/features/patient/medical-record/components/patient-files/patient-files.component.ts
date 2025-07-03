import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { PatientFile } from '../../../../../core/patient/domain/models/patient-file.model';

import { ToastService } from '../../../../../shared/services/toast.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PatientFileService } from '../../../../../core/patient/services/patient-file.service';

@Component({
  selector: 'app-patient-files',
  standalone: false,
  templateUrl: './patient-files.component.html',
  styleUrls: ['./patient-files.component.css'],
  
})
export class PatientFilesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  files: PatientFile[] = [];
  categories: { key: string, value: string }[] = [];
  
  isLoading = true;
  errorMessage: string | null = null;

  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  isDragging = false;
  
  // Filters
  activeCategory: string = '';
  dateFrom: string = '';
  dateTo: string = '';

  // Preview loading state
  isPreviewLoading: boolean = false;

  // Modals
  isUploadModalOpen = false;
  isEditModalOpen = false;
  isViewModalOpen = false;
  selectedFileForEdit: PatientFile | null = null;
  selectedFileForView: PatientFile | null = null;
  previewUrl: SafeUrl | null = null;
  private objectUrl: string | null = null; // Pour la révocation de l'URL
  
  uploadForm: FormGroup;
  editForm: FormGroup;
  selectedFile: File | null = null;

  // Confirmation delete modal
  selectedFileIdToDelete: number | null = null;
  isDeleteConfirmModalOpen: boolean = false;

  // Uploading state
  isUploading: boolean = false;

  constructor(
    private fileService: PatientFileService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.uploadForm = this.fb.group({
      file: [null, Validators.required],
      category: ['', Validators.required],
      description: ['']
    });
    this.editForm = this.fb.group({
      category: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFiles();
  }

  loadCategories(): void {
    this.fileService.getCategories().pipe(
      catchError(err => {
        this.toastService.error('Could not load file categories from server.');
        return of({});
      })
    ).subscribe(data => {
      this.categories = Object.entries(data).map(([key, value]) => ({ key, value }));
    });
  }

  loadFiles(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.fileService.getFiles({ 
      category: this.activeCategory || undefined,
      date_from: this.dateFrom || undefined,
      date_to: this.dateTo || undefined
    }).subscribe({
      next: (data) => {
        this.files = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load files. Please try again later.';
        this.toastService.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void { this.loadFiles(); }

  clearFilters(): void {
    this.activeCategory = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.loadFiles();
  }

  openUploadModal(): void { this.isUploadModalOpen = true; }

  openEditModal(file: PatientFile): void {
    this.selectedFileForEdit = file;
    this.editForm.patchValue({
      category: file.category,
      description: file.description
    });
    this.isEditModalOpen = true;
  }

  openViewModal(file: PatientFile): void {
    this.selectedFileForView = file;
    this.isViewModalOpen = true;
    this.previewUrl = null;
    this.isPreviewLoading = false;

    if (file.type === 'image' || file.mimeType === 'application/pdf') {
      this.isPreviewLoading = true;
      this.fileService.getFileBlob(file.id).subscribe({
        next: (blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          if (file.type === 'image') {
            this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
          } else {
            this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
          }
          this.isPreviewLoading = false;
        },
        error: () => {
          this.isPreviewLoading = false;
        }
      });
    }
  }

  openDeleteConfirmModal(fileId: number): void {
    this.selectedFileIdToDelete = fileId;
    this.isDeleteConfirmModalOpen = true;
  }

  confirmDelete(): void {
    if (this.selectedFileIdToDelete !== null) {
      this.fileService.deleteFile(this.selectedFileIdToDelete).subscribe({
        next: () => {
          this.files = this.files.filter(f => f.id !== this.selectedFileIdToDelete);
          this.toastService.success('File deleted successfully.');
          this.closeDeleteConfirmModal();
        },
        error: () => {
          this.toastService.error('Failed to delete file.');
          this.closeDeleteConfirmModal();
        }
      });
    }
  }

  closeDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.selectedFileIdToDelete = null;
  }

  closeModals(): void {
    this.isUploadModalOpen = false;
    this.isEditModalOpen = false;
    this.isViewModalOpen = false;
    this.selectedFileForEdit = null;
    this.selectedFileForView = null;
    this.isPreviewLoading = false;
    this.isUploading = false;
    this.selectedFile = null;
    this.uploadForm.patchValue({ file: null });

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
      this.previewUrl = null;
    }

    this.uploadForm.reset();
    this.editForm.reset();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    this.handleFileList(element.files);
  }

  handleFileList(files: FileList | null): void {
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.uploadForm.patchValue({ file: this.selectedFile });
    }
  }

  handleUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile || this.isUploading) {
      this.toastService.warning('Please select a file and a category.');
      return;
    }
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);
    formData.append('category', this.uploadForm.value.category);
    formData.append('description', this.uploadForm.value.description || '');
    formData.append('patient_id', '19');

    this.fileService.uploadFile(formData).subscribe({
      next: (newFile) => {
        this.files.unshift(newFile);
        this.toastService.success('File uploaded successfully!');
        this.isUploading = false;
        this.closeModals();
      },
      error: () => {
        this.toastService.error('File upload failed.');
        this.isUploading = false;
      }
    });
  }

  handleUpdate(): void {
    if (!this.selectedFileForEdit || this.editForm.invalid) return;

    this.fileService.updateFile(this.selectedFileForEdit.id, this.editForm.value).subscribe({
      next: (updatedFile) => {
        const index = this.files.findIndex(f => f.id === updatedFile.id);
        if (index > -1) {
          this.files[index] = updatedFile;
        }
        this.toastService.success('File updated successfully!');
        this.closeModals();
      },
      error: () => this.toastService.error('File update failed.')
    });
  }

  handleDelete(fileId: number): void {
    this.openDeleteConfirmModal(fileId);
  }
  
  handleDownload(file: PatientFile): void {
    this.fileService.getFileBlob(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Download failed.');
      }
    });
  }

  // --- UI Helpers ---
  setViewMode(mode: 'grid' | 'list'): void { this.viewMode = mode; }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.isDragging = false; }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.handleFileList(event.dataTransfer?.files ?? null);
  }

  getCategoryClass(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'xray': 'blue', 'scan': 'teal', 'lab_report': 'green',
      'insurance': 'amber', 'prescription': 'red', 'document': 'slate', 'other': 'slate'
    };
    const color = categoryMap[category] || 'slate';
    return `category-${color}`;
  }

  getIconForMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'fas fa-file-image';
    if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
    if (mimeType.startsWith('video/')) return 'fas fa-file-video';
    if (mimeType.startsWith('audio/')) return 'fas fa-file-audio';
    return 'fas fa-file-alt';
  }
}