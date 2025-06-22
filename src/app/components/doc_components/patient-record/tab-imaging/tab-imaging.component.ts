import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFilesService, PatientFile } from '../../../../services/doc-services/patient-files.service';

@Component({
  selector: 'app-tab-imaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-imaging.component.html',
  styleUrl: './tab-imaging.component.css'
})
export class TabImagingComponent implements OnInit, OnChanges {
  @Input() patientId!: number;
  images: PatientFile[] = [];
  filteredImages: PatientFile[] = [];
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
  
  // Image viewer
  selectedImage: PatientFile | null = null;
  showImageViewer: boolean = false;
  
  // State
  isLoading: boolean = false;
  isUploading: boolean = false;
  error: string | null = null;
  uploadError: string | null = null;
  
  constructor(
    private patientFilesService: PatientFilesService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    console.log('TabImagingComponent initialized with patientId:', this.patientId);
    this.loadCategories();
    if (this.patientId) {
      this.loadImages();
    }
    // Initialize display labels
    this.updateSelectedCategoryLabels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadImages();
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
          'xray': 'X-Ray',
          'scan': 'CT/MRI Scan',
          'other': 'Other'
        };
        this.categoriesLoaded = true;
        this.updateSelectedCategoryLabels(); // Update labels after fallback categories set
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Load images for the patient
   */
  loadImages(): void {
    if (!this.patientId) return;

    this.isLoading = true;
    this.error = null;    this.patientFilesService.getPatientFilesByType(this.patientId, 'image').subscribe({
      next: (images) => {
        this.images = images;
        this.applyFilters();
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error loading images:', error);
        this.error = 'Failed to load images. Please try again.';
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Apply filters and sorting
   */
  applyFilters(): void {
    let filtered = [...this.images];

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === this.selectedCategory);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(img => 
        img.originalFilename.toLowerCase().includes(term) ||
        img.description?.toLowerCase().includes(term) ||
        img.uploadedBy.toLowerCase().includes(term)
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

    this.filteredImages = filtered;
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
    const category = this.imagingCategoryOptions.find(opt => opt.value === categoryValue);
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
  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected image file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Validate file type (images only)
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/tiff',
        'image/svg+xml'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.uploadError = `Image type "${file.type}" is not allowed. Please select a valid image file (JPEG, PNG, GIF, BMP, WebP, TIFF, or SVG).`;
        console.error('Invalid image type:', file.type);
        return;
      }

      // Validate file size (max 20MB for images)
      if (file.size > 20 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 20MB.';
        return;
      }

      this.uploadForm.file = file;
      this.uploadError = null;
    }
  }

  /**
   * Upload image
   */
  uploadImage(): void {
    if (!this.uploadForm.file || !this.uploadForm.category || !this.patientId) {
      this.uploadError = 'Please fill in all required fields.';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    const uploadData = {
      patient_id: this.patientId,
      category: this.uploadForm.category,
      description: this.uploadForm.description || undefined,
      file_type: 'image' as const,
      file: this.uploadForm.file
    };

    this.patientFilesService.uploadPatientFile(uploadData).subscribe({      next: (uploadedFile) => {
        console.log('Image uploaded successfully:', uploadedFile);
        this.images.unshift(uploadedFile);
        this.applyFilters();
        this.toggleUploadForm();
        this.isUploading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.uploadError = error.error?.message || 'Failed to upload image. Please try again.';
        this.isUploading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }

  /**
   * Open image viewer
   */
  openImageViewer(image: PatientFile): void {
    this.selectedImage = image;
    this.showImageViewer = true;
  }

  /**
   * Close image viewer
   */
  closeImageViewer(): void {
    this.selectedImage = null;
    this.showImageViewer = false;
  }

  /**
   * Download image
   */
  downloadImage(image: PatientFile): void {
    window.open(image.downloadUrl, '_blank');
  }

  /**
   * Delete image
   */
  deleteImage(image: PatientFile): void {
    if (confirm(`Are you sure you want to delete "${image.originalFilename}"?`)) {
      this.patientFilesService.deletePatientFile(image.id).subscribe({        next: () => {
          this.images = this.images.filter(img => img.id !== image.id);
          this.applyFilters();
          // Removed cdr.detectChanges() to prevent Angular assertion errors
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          this.error = 'Failed to delete image. Please try again.';
        }
      });
    }
  }

  /**
   * Get category badge color
   */
  getCategoryBadgeColor(category: string): string {
    switch (category) {
      case 'xray':
        return 'bg-blue-100 text-blue-800';
      case 'scan':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-primary/10 text-primary';
    }
  }
  /**
   * Get imaging category options for upload
   */
  get imagingCategoryOptions(): Array<{value: string, label: string}> {
    // Filter for imaging-specific categories
    const imagingCategories = Object.entries(this.categories)
      .filter(([key]) => ['xray', 'scan', 'other'].includes(key))
      .map(([value, label]) => ({ value, label }));
    
    // If no categories loaded from API, provide defaults
    if (imagingCategories.length === 0) {
      return [
        { value: 'xray', label: 'X-Ray' },
        { value: 'scan', label: 'CT/MRI Scan' },
        { value: 'other', label: 'Other' }
      ];
    }
    
    return imagingCategories;
  }
}
