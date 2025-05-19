import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ImageUtilsService {
  
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitizes an image URL and ensures it has a complete URL path
   * @param url The image URL to sanitize
   * @returns A SafeUrl that can be used in the template
   */
  sanitizeImageUrl(url: string): SafeUrl {
    if (!url) return '';
    
    // Check if it's a relative URL and prepend base API URL if needed
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      // Assuming backend URL is configured somewhere, but as a fallback:
      const baseApiUrl = 'http://localhost:8000'; // Replace with your actual API base URL
      url = `${baseApiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}