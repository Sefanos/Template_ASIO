import { Component, EventEmitter, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Alert } from '../../../../models/alert.model';
import { AlertService, AlertRequest } from '../../../../services/doc-services/alert.service';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alert-modal.component.html'
})
export class AlertModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() patientId: number | null = null;
  @Input() alerts: Alert[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() alertsUpdated = new EventEmitter<Alert[]>();

  // Component state
  error: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;
  showDeleteConfirmation: boolean = false;
  alertToDelete: Alert | null = null;

  // Loading states for individual operations
  savingAlert: boolean = false;
  deletingAlert: boolean = false;
  togglingAlert: boolean = false;
  
  // Track specific alerts being operated on
  alertBeingToggled: string | number | null = null;
  alertBeingSaved: string | number | null = null;
  alertBeingDeleted: string | number | null = null;

  // Search and filter functionality
  searchTerm: string = '';
  selectedType: string = '';
  selectedSeverity: string = '';
  showActiveOnly: boolean = false;
  showInactiveOnly: boolean = false;

  // Add/Edit functionality
  showAddForm: boolean = false;
  showEditForm: boolean = false;
  alertToEdit: Alert | null = null;

  // Alert types and severities for filters
  alertTypes = [
    { value: '', label: 'All Types' },
    { value: 'allergy', label: 'Allergy' },
    { value: 'medication', label: 'Medication' },
    { value: 'condition', label: 'Condition' },
    { value: 'warning', label: 'Warning' }
  ];

  severityLevels = [
    { value: '', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // New alert form data
  newAlert: Partial<Alert> = {
    type: 'warning',
    severity: 'medium',
    title: '',
    description: '',
    isActive: true
  };

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    console.log('AlertModal initialized', { isOpen: this.isOpen, patientId: this.patientId });
    
    // Add event listener for escape key
    if (this.isOpen) {
      document.addEventListener('keydown', this.handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleEscapeKey);
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('AlertModal ngOnChanges called:', changes);
    
    if (changes['alerts'] && changes['alerts'].currentValue) {
      const alerts = changes['alerts'].currentValue;
      console.log('Alerts input changed:', {
        previous: changes['alerts'].previousValue,
        current: alerts,
        breakdown: {
          total: alerts.length,
          active: alerts.filter((a: Alert) => a.isActive).length,
          inactive: alerts.filter((a: Alert) => !a.isActive).length
        }
      });
    }
    
    if (changes['isOpen'] && this.isOpen && this.patientId) {
      console.log('🔍 Modal opened, loading alerts for patient:', this.patientId);
      this.loadPatientAlerts();
      document.addEventListener('keydown', this.handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else if (changes['isOpen'] && !this.isOpen) {
      document.removeEventListener('keydown', this.handleEscapeKey);
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Handle escape key press
   */
  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  /**
   * Handle backdrop click - only close if clicked on backdrop, not modal content
   */
  onBackdropClick(event: MouseEvent) {
    // Only close if the clicked element is the backdrop itself
    if (event.target === event.currentTarget) {
      console.log('Backdrop clicked, closing modal');
      this.closeModal();
    }
  }

  /**
   * Close modal with proper cleanup
   */
  closeModal() {
    console.log('Closing modal...');
    
    // Clear any messages
    this.error = null;
    this.successMessage = null;
    
    // Remove event listeners and restore scrolling
    document.removeEventListener('keydown', this.handleEscapeKey);
    document.body.style.overflow = 'auto';
    
    // Emit close event
    this.close.emit();
  }

  /**
   * Save alerts and close modal
   */
  saveAndClose() {
    console.log('Saving alerts and closing...');
    this.alertsUpdated.emit(this.alerts);
    this.closeModal();
  }

  /**
   * Confirm delete alert
   */
  confirmDelete(alert: Alert) {
    this.alertToDelete = alert;
    this.showDeleteConfirmation = true;
  }

  /**
   * Delete the selected alert
   */
  deleteAlert() {
    if (!this.alertToDelete?.id) {
      this.error = 'Cannot delete alert: invalid alert ID';
      return;
    }

    // Validate alert ID
    const alertId = typeof this.alertToDelete.id === 'string' ? parseInt(this.alertToDelete.id, 10) : Number(this.alertToDelete.id);
    
    if (isNaN(alertId) || alertId <= 0) {
      this.error = 'Cannot delete alert: invalid alert ID format';
      console.error('Invalid alert ID format:', this.alertToDelete.id, 'converted to:', alertId);
      return;
    }
    
    this.deletingAlert = true;
    this.alertBeingDeleted = this.alertToDelete.id;
    this.error = null;
    
    console.log('Deleting alert with ID:', alertId, 'Alert:', this.alertToDelete);
    
    this.alertService.deleteAlert(alertId).subscribe({
      next: () => {
        console.log('Alert deleted successfully');
        
        // Remove alert from the local array
        this.alerts = this.alerts.filter(alert => alert.id !== this.alertToDelete!.id);
        
        // Emit updated alerts to parent
        this.alertsUpdated.emit([...this.alerts]);
        
        // Close confirmation and show success message
        this.cancelDelete();
        this.successMessage = 'Alert deleted successfully';
        this.deletingAlert = false;
        this.alertBeingDeleted = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        console.error('Error deleting alert:', error);
        this.error = error.error?.message || 'Failed to delete alert. Please try again.';
        this.deletingAlert = false;
        this.alertBeingDeleted = null;
      }
    });
  }

  /**
   * Cancel delete operation
   */
  cancelDelete() {
    this.showDeleteConfirmation = false;
    this.alertToDelete = null;
  }

  /**
   * Get filtered alerts based on search and filter criteria
   */
  get filteredAlerts(): Alert[] {
    let filtered = [...this.alerts];

    console.log('Filtering alerts:', {
      totalAlerts: this.alerts.length,
      searchTerm: this.searchTerm,
      selectedType: this.selectedType,
      selectedSeverity: this.selectedSeverity,
      showActiveOnly: this.showActiveOnly,
      showInactiveOnly: this.showInactiveOnly,
      alertStatuses: this.alerts.map(a => ({ id: a.id, title: a.title, isActive: a.isActive }))
    });

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchLower) ||
        alert.description?.toLowerCase().includes(searchLower) ||
        alert.type.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(alert => alert.type === this.selectedType);
      console.log('After type filter:', filtered.length);
    }

    // Apply severity filter
    if (this.selectedSeverity) {
      filtered = filtered.filter(alert => alert.severity === this.selectedSeverity);
      console.log('After severity filter:', filtered.length);
    }

    // Apply status filter
    if (this.showActiveOnly) {
      filtered = filtered.filter(alert => alert.isActive);
      console.log('After active-only filter:', filtered.length);
    } else if (this.showInactiveOnly) {
      filtered = filtered.filter(alert => !alert.isActive);
      console.log('After inactive-only filter:', filtered.length);
    }

    console.log('Final filtered alerts:', filtered.length, filtered.map(a => ({ id: a.id, title: a.title, isActive: a.isActive })));

    return filtered;
  }

  /**
   * Clear all filters and search
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedSeverity = '';
    this.showActiveOnly = false;
    this.showInactiveOnly = false;
  }

  /**
   * Toggle active only filter
   */
  toggleActiveOnly(): void {
    this.showActiveOnly = !this.showActiveOnly;
    if (this.showActiveOnly) {
      this.showInactiveOnly = false;
    }
  }

  /**
   * Toggle inactive only filter
   */
  toggleInactiveOnly(): void {
    this.showInactiveOnly = !this.showInactiveOnly;
    if (this.showInactiveOnly) {
      this.showActiveOnly = false;
    }
  }

  /**
   * Show all alerts (both active and inactive)
   */
  showAllAlerts(): void {
    this.showActiveOnly = false;
    this.showInactiveOnly = false;
  }

  /**
   * Show add alert form
   */
  showAddAlertForm(): void {
    this.resetNewAlertForm();
    this.showAddForm = true;
    this.showEditForm = false;
    this.error = null;
  }

  /**
   * Show edit alert form
   */
  editAlert(alert: Alert): void {
    this.alertToEdit = { ...alert };
    this.showEditForm = true;
    this.showAddForm = false;
    this.error = null;
  }

  /**
   * Cancel add/edit form
   */
  cancelForm(): void {
    this.showAddForm = false;
    this.showEditForm = false;
    this.alertToEdit = null;
    this.error = null;
    this.resetNewAlertForm();
  }

  /**
   * Save new alert
   */
  saveNewAlert(): void {
    if (!this.validateAlert(this.newAlert) || !this.patientId) {
      this.error = this.patientId ? null : 'Patient ID is required';
      return;
    }

    this.savingAlert = true;
    this.alertBeingSaved = 'new';
    this.error = null;

    const alertData: Alert = {
      patient_id: this.patientId,
      title: this.newAlert.title!,
      description: this.newAlert.description || '',
      type: this.newAlert.type!,
      severity: this.newAlert.severity!,
      isActive: this.newAlert.isActive ?? true
    };

    this.alertService.createAlert(alertData).subscribe({
      next: (newAlert) => {
        console.log('Alert created successfully:', newAlert);
        
        // Add the new alert to the local array
        this.alerts.push(newAlert);
        
        // Emit updated alerts to parent
        this.alertsUpdated.emit([...this.alerts]);
        
        // Close form and show success message
        this.showAddForm = false;
        this.resetNewAlertForm();
        this.successMessage = 'Alert created successfully';
        this.savingAlert = false;
        this.alertBeingSaved = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        console.error('Error creating alert:', error);
        this.error = error.error?.message || 'Failed to create alert. Please try again.';
        this.savingAlert = false;
        this.alertBeingSaved = null;
      }
    });
  }

  /**
   * Save edited alert
   */
  saveEditedAlert(): void {
    if (!this.alertToEdit || !this.validateAlert(this.alertToEdit)) {
      return;
    }

    // Validate alert ID
    if (!this.alertToEdit.id || this.alertToEdit.id === null || this.alertToEdit.id === undefined) {
      this.error = 'Cannot update alert: invalid alert ID';
      return;
    }

    const alertId = typeof this.alertToEdit.id === 'string' ? parseInt(this.alertToEdit.id, 10) : Number(this.alertToEdit.id);
    
    if (isNaN(alertId) || alertId <= 0) {
      this.error = 'Cannot update alert: invalid alert ID format';
      console.error('Invalid alert ID format:', this.alertToEdit.id, 'converted to:', alertId);
      return;
    }

    this.savingAlert = true;
    this.alertBeingSaved = this.alertToEdit.id;
    this.error = null;

    const alertData: Partial<Alert> = {
      title: this.alertToEdit.title,
      description: this.alertToEdit.description || '',
      type: this.alertToEdit.type,
      severity: this.alertToEdit.severity,
      isActive: this.alertToEdit.isActive
    };

    console.log('Updating alert with ID:', alertId, 'Data:', alertData);

    this.alertService.updateAlert(alertId, alertData).subscribe({
      next: (updatedAlert) => {
        console.log('Alert updated successfully:', updatedAlert);
        
        // Update the alert in the local array
        const index = this.alerts.findIndex(alert => alert.id === this.alertToEdit!.id);
        if (index !== -1) {
          this.alerts[index] = updatedAlert;
        }
        
        // Emit updated alerts to parent
        this.alertsUpdated.emit([...this.alerts]);
        
        // Close form and show success message
        this.showEditForm = false;
        this.alertToEdit = null;
        this.successMessage = 'Alert updated successfully';
        this.savingAlert = false;
        this.alertBeingSaved = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        console.error('Error updating alert:', error);
        this.error = error.error?.message || 'Failed to update alert. Please try again.';
        this.savingAlert = false;
        this.alertBeingSaved = null;
      }
    });
  }

  /**
   * Reset new alert form
   */
  resetNewAlertForm(): void {
    this.newAlert = {
      type: 'warning',
      severity: 'medium',
      title: '',
      description: '',
      isActive: true
    };
  }

  /**
   * Validate alert data
   */
  private validateAlert(alert: Partial<Alert>): boolean {
    if (!alert.title?.trim()) {
      this.error = 'Alert title is required';
      return false;
    }

    if (!alert.type) {
      this.error = 'Alert type is required';
      return false;
    }

    if (!alert.severity) {
      this.error = 'Alert severity is required';
      return false;
    }

    this.error = null;
    return true;
  }

  /**
   * Toggle alert active status
   */
  toggleAlertStatus(alert: Alert): void {
    console.log('toggleAlertStatus called with alert:', alert);
    console.log('Alert ID:', alert.id, 'Type:', typeof alert.id);
    
    if (!alert.id || alert.id === null || alert.id === undefined) {
      this.error = 'Cannot toggle alert status: invalid alert ID';
      console.error('Invalid alert ID:', alert.id);
      return;
    }

    // Convert to number and validate
    const alertId = typeof alert.id === 'string' ? parseInt(alert.id, 10) : Number(alert.id);
    
    if (isNaN(alertId) || alertId <= 0) {
      this.error = 'Cannot toggle alert status: invalid alert ID format';
      console.error('Invalid alert ID format:', alert.id, 'converted to:', alertId);
      return;
    }

    console.log('Toggling alert status:', { 
      alertId: alertId, 
      originalId: alert.id,
      currentStatus: alert.isActive, 
      newStatus: !alert.isActive,
      fullAlert: alert
    });

    this.togglingAlert = true;
    this.alertBeingToggled = alert.id;
    this.error = null;

    const newStatus = !alert.isActive;

    // Create a more complete update object
    const updateData: Partial<Alert> = {
      isActive: newStatus,
      type: alert.type, // Include type as fallback
      severity: alert.severity, // Include severity as fallback
      title: alert.title, // Include title as fallback
      description: alert.description,
      patient_id: alert.patient_id
    };

    console.log('Sending update data:', updateData);
    console.log('Using alert ID:', alertId);

    this.alertService.updateAlert(alertId, updateData).subscribe({
      next: (updatedAlert) => {
        console.log('Alert status toggled successfully:', updatedAlert);
        console.log('Alerts before update:', this.alerts.length);
        
        // Update the alert in the local array
        const index = this.alerts.findIndex(a => a.id === alert.id);
        if (index !== -1) {
          this.alerts[index] = updatedAlert;
          console.log('Updated alert in local array at index:', index);
        } else {
          console.warn('Alert not found in local array for update');
        }
        
        console.log('Alerts after update:', this.alerts.length);
        console.log('Updated alerts:', this.alerts.map(a => ({ id: a.id, title: a.title, isActive: a.isActive })));
        
        // Emit updated alerts to parent
        this.alertsUpdated.emit([...this.alerts]);
        
        // Show success message
        const status = updatedAlert.isActive ? 'activated' : 'deactivated';
        this.successMessage = `Alert ${status} successfully`;
        this.togglingAlert = false;
        this.alertBeingToggled = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        console.error('Error toggling alert status:', error);
        this.error = error.error?.message || 'Failed to update alert status. Please try again.';
        this.togglingAlert = false;
        this.alertBeingToggled = null;
      }
    });
  }

  /**
   * Check if a specific alert is being toggled
   */
  isAlertBeingToggled(alert: Alert): boolean {
    return this.togglingAlert && this.alertBeingToggled === alert.id;
  }

  /**
   * Check if a specific alert is being saved
   */
  isAlertBeingSaved(alert: Alert): boolean {
    return this.savingAlert && this.alertBeingSaved === alert.id;
  }

  /**
   * Check if a specific alert is being deleted
   */
  isAlertBeingDeleted(alert: Alert): boolean {
    return this.deletingAlert && this.alertBeingDeleted === alert.id;
  }

  /**
   * Check if any operation is being performed on a specific alert
   */
  isAlertBeingProcessed(alert: Alert): boolean {
    return this.isAlertBeingToggled(alert) || this.isAlertBeingSaved(alert) || this.isAlertBeingDeleted(alert);
  }

  /**
   * Get severity badge classes
   */
  getSeverityClasses(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get type badge classes
   */
  getTypeClasses(type: string): string {
    switch (type) {
      case 'allergy':
        return 'bg-red-50 text-red-700';
      case 'medication':
        return 'bg-purple-50 text-purple-700';
      case 'condition':
        return 'bg-blue-50 text-blue-700';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'allergy': return '🚫';
      case 'medication': return '💊';
      case 'condition': return '🏥';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  /**
   * Track by function for alert list performance
   */
  trackByAlertId(index: number, alert: Alert): string | number {
    return alert.id || index;
  }

  /**
   * Load patient alerts from API
   */
  loadPatientAlerts(): void {
    if (!this.patientId) {
      console.warn('⚠️ No patient ID provided, cannot load alerts');
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('🔍 Loading alerts for patient:', this.patientId);

    this.alertService.getPatientAlerts(this.patientId).subscribe({
      next: (alerts) => {
        console.log('✅ Successfully loaded alerts:', alerts);
        console.log('🔍 Alert breakdown:', {
          total: alerts.length,
          active: alerts.filter(a => a.isActive).length,
          inactive: alerts.filter(a => !a.isActive).length
        });
        
        this.alerts = alerts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading alerts:', error);
        this.error = 'Failed to load patient alerts. Please try again.';
        this.alerts = [];
        this.isLoading = false;
      }
    });
  }
}
