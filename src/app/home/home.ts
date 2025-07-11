import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-home',
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal('');
  successMessage = signal('');
  bgSeg: WritableSignal<string> = signal("Sparse");

  parameters = signal({
    active_scale: 0.08152,
    brightness_thresh: 0.15,
    event_thresh: 0.5,
    neighborhood: 50
  });

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.isVideoFile(file)) {
      this.selectedFile.set(file);
      this.errorMessage.set('');
      this.successMessage.set('');
    } else {
      this.errorMessage.set('Please select a valid video file');
      this.selectedFile.set(null);
    }
  }

  private isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  onUpload() {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select a video file first');
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = new FormData();
    formData.append('video', file);
    
    // Add parameters to form data
    const params = this.parameters();
    Object.keys(params).forEach(key => {
      formData.append(key, params[key as keyof typeof params].toString());
    });
    formData.append('motion_type', this.bgSeg());
    this.http.post('http://127.0.0.1:5000/upload', formData, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
          }
        } else if (event.type === HttpEventType.Response) {
          // Download the processed video
          const blob = event.body as Blob;
          const originalName = file.name;
          const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
          const downloadName = `${baseName}_motion_analysis.avi`;
          
          saveAs(blob, downloadName);
          
          this.successMessage.set('Video processed successfully and downloaded!');
          this.isUploading.set(false);
          this.uploadProgress.set(0);
          this.selectedFile.set(null);
          
          // Reset file input
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage.set(error.error?.error || 'An error occurred during processing');
        this.isUploading.set(false);
        this.uploadProgress.set(0);
      }
    });
  }

  onParameterChange(param: string, value: string) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const currentParams = this.parameters();
      this.parameters.set({
        ...currentParams,
        [param]: numValue
      });
    }
  }

  resetToDefaults() {
    this.parameters.set({
      active_scale: 0.08152,
      brightness_thresh: 0.15,
      event_thresh: 0.5,
      neighborhood: 50
    });
  }
}