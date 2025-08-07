import { ChangeDetectionStrategy, Component, signal, Output, OutputEmitterRef } from '@angular/core';
import { HttpEventType, HttpClient} from '@angular/common/http';
import { CommonModule} from '@angular/common';
import { MatButtonModule } from '@angular/material/button'; 
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

export interface VidParams {
  frame_rate: number;
  distance: number;
  ruler_length: number;
  resolution: {
    width: number;
    height: number;
  };
}


@Component({
  selector: 'app-find-scaling',
  imports: [CommonModule, MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatOptionModule],
  templateUrl: './find-scaling.html',
  styleUrl: './find-scaling.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FindScaling {
    selectedFile = signal<File | null>(null);
    uploadProgress = signal(0);
    errorMessage = signal('');
    successMessage = signal('');
    isUploading = signal(false);
    @Output() scaleAndParams = new OutputEmitterRef<{ scale: number, params: VidParams }>();

  vidParams = signal<VidParams>({
    frame_rate: 30,
    distance: 100,
    ruler_length: 30,
    resolution: {
      height: 720, 
      width: 1280
    }, 
  });

  onFileSelected(event: any) {
    const file = event.target.files[0]; //files is a filelist of everything the user selected
    if (file && this.validate(file)) {
      this.selectedFile.set(file);
      this.errorMessage.set(''); this.successMessage.set('');
    } else {
      this.errorMessage.set('Please select a valid video!'); this.selectedFile.set(null);
    }
  }
  validate(file: File) {
    return file.type.startsWith('video/');
  }
  upload() {
    const file = this.selectedFile();
    if (!file) {
        this.errorMessage.set('Please select a valid video!');
        return;
    }
    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    const formData = new FormData();
    formData.append('video', file);
    formData.append('resolution_width', this.vidParams().resolution.width.toString());
    formData.append('resolution_height', this.vidParams().resolution.height.toString());
    Object.entries(this.vidParams()).forEach(([key, value]) => {
        if (key !== 'resolution') {
        formData.append(key, value.toString());
        }
    });
    this.http.post('http://127.0.0.1:5000/find-scale', formData, {
        responseType: 'json',
        reportProgress: true,
        observe: 'events'
    }).subscribe({
        next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
            }
        } else if (event.type === HttpEventType.Response) {
            const scale = (event.body as any).result;
            this.successMessage.set(`Scale computed: ${scale} cm/px`);
            this.isUploading.set(false);
            this.isUploading.set(false);
            this.selectedFile.set(null);
            this.scaleAndParams.emit({ scale, params: this.vidParams()});

        }
        },
        error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage.set(error.error?.error || 'An error occurred during processing');
        this.isUploading.set(false)
        this.selectedFile.set(null);
        }
    })
    }

    onParameterChange(param: string, value: string) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        const currentParams = this.vidParams();
        this.vidParams.set({
        ...currentParams,
        [param]: numValue
        });
    }
    }
    onResolutionSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    const [width, height] = val.split('x').map(Number);

    if (!isNaN(width) && !isNaN(height)) {
        const currentParams = this.vidParams();
        this.vidParams.set({
        ...currentParams,
        resolution: { width, height }
        });
    }
    }

    constructor(
    private http: HttpClient
    ) {}
}
