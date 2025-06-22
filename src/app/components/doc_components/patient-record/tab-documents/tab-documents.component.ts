import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFilesService, PatientFile } from '../../../../services/doc-services/patient-files.service';

@Component({
  selector: 'app-tab-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-documents.component.html',
  styleUrl: './tab-documents.component.css'
})
export class TabDocumentsComponent implements OnInit, OnChanges {
  @Input() patientId!: number;  documents: PatientFile[] = [];
  filteredDocuments: PatientFile[] = [];
  categories: { [key: string]: string } = {};
  categoriesLoaded: boolean = false;
  
  // Filter and sort options
  selectedCategory: string = 'all';
  sortBy: 'date' | 'name' | 'category' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchTerm: string = '';
    // Upload form
  showUploadForm: boolean = false;
  uploadForm = {
    category: '',
    description: '',
    file: null as File | null
  };
  
  // Display properties for better change detection
  selectedUploadCategoryLabel: string = '';
  selectedFilterCategoryLabel: string = '';
  
  // State
  isLoading: boolean = false;
  isUploading: boolean = false;
  error: string | null = null;
  uploadError: string | null = null;
  
  constructor(
    private patientFilesService: PatientFilesService,
    private cdr: ChangeDetectorRef
  ) {}  ngOnInit(): void {
    console.log('TabDocumentsComponent initialized with patientId:', this.patientId);
    this.loadCategories();
    if (this.patientId) {
      this.loadDocuments();
    }
    // Initialize display labels
    this.updateSelectedCategoryLabels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('TabDocumentsComponent changes:', changes);
    if (changes['patientId'] && this.patientId) {
      this.loadDocuments();
    }
  }  /**
   * Load file categories
   */
  loadCategories(): void {
    console.log('Loading categories...');    this.patientFilesService.getFileCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded successfully:', categories);
        this.categories = categories;
        this.categoriesLoaded = true;
        this.updateSelectedCategoryLabels(); // Update labels after categories load
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Set default categories if API fails
        this.categories = {
          'lab_report': 'Lab Report',
          'insurance': 'Insurance Document',
          'prescription': 'Prescription',
          'document': 'General Document',
          'other': 'Other'
        };
        this.categoriesLoaded = true;
        this.updateSelectedCategoryLabels(); // Update labels after fallback categories set
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Load documents for the patient
   */
  loadDocuments(): void {
    if (!this.patientId) return;

    this.isLoading = true;
    this.error = null;

    this.patientFilesService.getPatientFilesByType(this.patientId, 'document').subscribe({      next: (documents) => {
        this.documents = documents;
        this.applyFilters();
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.error = 'Failed to load documents. Please try again.';
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Apply filters and sorting
   */
  applyFilters(): void {
    let filtered = [...this.documents];

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === this.selectedCategory);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(doc => 
        doc.originalFilename.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.uploadedBy.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortBy) {
        case 'date':
          compareValue = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'name':
          compareValue = a.originalFilename.localeCompare(b.originalFilename);
          break;
        case 'category':
          compareValue = a.categoryLabel.localeCompare(b.categoryLabel);
          break;
      }
      
      return this.sortOrder === 'desc' ? -compareValue : compareValue;
    });

    this.filteredDocuments = filtered;
  }  /**
   * Handle category filter change
   */
  onCategoryChange(): void {
    console.log('Category filter changed to:', this.selectedCategory);
    this.applyFilters();
    
    // Update the display label
    this.updateSelectedCategoryLabels();
  }
  /**
   * Handle sort change
   */
  onSortChange(): void {
    console.log('Sort changed to:', this.sortBy);
    this.applyFilters();
  }

  /**
   * Handle search change
   */
  onSearchChange(): void {
    console.log('Search changed to:', this.searchTerm);
    this.applyFilters();
  }

  /**
   * Toggle sort order
   */
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }  /**
   * Toggle upload form
   */
  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (this.showUploadForm) {
      this.resetUploadForm();
    }
    console.log('Upload form toggled. Visible:', this.showUploadForm, 'Category value:', this.uploadForm.category);
  }/**
   * Reset upload form
   */
  resetUploadForm(): void {
    this.uploadForm = {
      category: '',
      description: '',
      file: null
    };
    this.uploadError = null;
    
    // Clear display labels
    this.selectedUploadCategoryLabel = '';
  }  /**
   * Handle upload form category change
   */
  onUploadCategoryChange(): void {
    console.log('Upload form category changed to:', this.uploadForm.category);
    this.uploadError = null; // Clear any previous errors
    
    // Update the display label
    this.updateSelectedCategoryLabels();
  }
  /**
   * Get selected category label for display
   */
  getSelectedCategoryLabel(categoryValue: string): string {
    const category = this.categoryOptions.find(opt => opt.value === categoryValue);
    return category?.label || categoryValue;
  }  /**
   * Update selected category labels for display
   */
  updateSelectedCategoryLabels(): void {
    // Only log during development, avoid complex operations during change detection
    if (console && console.log) {
      console.log('Updating category labels. Current values:', {
        uploadCategory: this.uploadForm.category,
        filterCategory: this.selectedCategory,
        categoriesLoaded: this.categoriesLoaded
      });
    }
    
    // Update upload form category label
    if (this.uploadForm.category) {
      this.selectedUploadCategoryLabel = this.getSelectedCategoryLabel(this.uploadForm.category);
    } else {
      this.selectedUploadCategoryLabel = '';
    }
    
    // Update filter category label
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      this.selectedFilterCategoryLabel = this.getSelectedCategoryLabel(this.selectedCategory);
    } else {
      this.selectedFilterCategoryLabel = '';
    }
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Validate file type (documents only)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/rtf'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.uploadError = `File type "${file.type}" is not allowed. Please select a valid document file (PDF, Word, Excel, or Text).`;
        console.error('Invalid file type:', file.type);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 10MB.';
        return;
      }

      this.uploadForm.file = file;
      this.uploadError = null;
    }
  }
  /**
   * Upload document
   */
  uploadDocument(): void {
    if (!this.uploadForm.file || !this.uploadForm.category || !this.patientId) {
      this.uploadError = 'Please fill in all required fields.';
      return;
    }

    console.log('Starting document upload with data:', {
      patientId: this.patientId,
      category: this.uploadForm.category,
      file: {
        name: this.uploadForm.file.name,
        type: this.uploadForm.file.type,
        size: this.uploadForm.file.size
      },
      description: this.uploadForm.description
    });

    this.isUploading = true;
    this.uploadError = null;

    const uploadData = {
      patient_id: this.patientId,
      category: this.uploadForm.category,
      description: this.uploadForm.description || undefined,
      file_type: 'document' as const,
      file: this.uploadForm.file
    };

    this.patientFilesService.uploadPatientFile(uploadData).subscribe({      next: (uploadedFile) => {
        console.log('Document uploaded successfully:', uploadedFile);
        this.documents.unshift(uploadedFile);
        this.applyFilters();
        this.toggleUploadForm();
        this.isUploading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error uploading document:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload document. Please try again.';
        
        if (error.status === 422) {
          errorMessage = 'Validation error: Please check your file type and form data.';
        } else if (error.status === 413) {
          errorMessage = 'File is too large. Please select a smaller file.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat();
          errorMessage = errors.join(', ');
        }
          this.uploadError = errorMessage;
        this.isUploading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Download document
   */
  downloadDocument(document: PatientFile): void {
    window.open(document.downloadUrl, '_blank');
  }

  /**
   * Delete document
   */
  deleteDocument(document: PatientFile): void {
    if (confirm(`Are you sure you want to delete "${document.originalFilename}"?`)) {
      this.patientFilesService.deletePatientFile(document.id).subscribe({        next: () => {
          this.documents = this.documents.filter(d => d.id !== document.id);
          this.applyFilters();
          // Removed cdr.detectChanges() to prevent Angular assertion errors
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.error = 'Failed to delete document. Please try again.';
        }
      });
    }
  }

  /**
   * Get file icon class
   */
  getFileIcon(document: PatientFile): string {
    const icon = this.patientFilesService.getFileTypeIcon(document);
    
    switch (icon) {
      case 'file-pdf':
        return 'fas fa-file-pdf text-red-500';
      case 'file-word':
        return 'fas fa-file-word text-blue-500';
      case 'file-excel':
        return 'fas fa-file-excel text-green-500';
      case 'file-contract':
        return 'fas fa-file-contract text-purple-500';
      default:
        return 'fas fa-file text-gray-500';
    }
  }
  /**
   * Get category options for upload
   */
  get categoryOptions(): Array<{value: string, label: string}> {
    // Filter out imaging-specific categories and provide fallbacks
    const documentCategories = Object.entries(this.categories)
      .filter(([key]) => !['xray', 'scan'].includes(key))
      .map(([value, label]) => ({ value, label }));
    
    // If no categories loaded from API, provide defaults
    if (documentCategories.length === 0) {
      return [
        { value: 'lab_report', label: 'Lab Report' },
        { value: 'insurance', label: 'Insurance Document' },
        { value: 'prescription', label: 'Prescription' },
        { value: 'document', label: 'General Document' },
        { value: 'other', label: 'Other' }
      ];
    }
    
    return documentCategories;
  }
}
