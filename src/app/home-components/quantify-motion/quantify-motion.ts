import { ChangeDetectionStrategy, Component, signal, Input, effect } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { MatButtonModule } from '@angular/material/button'; 
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

interface ProcessingParameters {
  active_scale: number;
  brightness_thresh: number;
  event_thresh: number;
  neighborhood: number;
  frame_rate: number;
  distance: number;
  resolution: {
    width: number;
    height: number;
  };
  scale_fps: number;
  scale_res: {
    r_width: number;
    r_height: number;
  };
  scale_dist: number;
  scale_ruler_length: number;
  adjust_for_resolution: boolean;
  tlx: number;
  tly: number;
  trx: number;
  try: number;
  blx: number;
  bly: number;
  brx: number;
  bry: number;
}

@Component({
  selector: 'app-quantify-motion',
  imports: [FormsModule, CommonModule, MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatOptionModule],
  templateUrl: './quantify-motion.html',
  styleUrl: './quantify-motion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuantifyMotion {
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  processingStatus = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  processAlgo = signal("Sparse with bounding box"); 
  boxType = signal("Enter coords")

  scaleSignal = signal<number | null>(null);
  vidParamsSignal = signal<any>(null);

  @Input() set scale(val: number | null) {
    this.scaleSignal.set(val);
  }

  @Input() set incomingVidParams(val: any) {
    this.vidParamsSignal.set(val);
  }

  private defaultParameters: ProcessingParameters = {
    active_scale: 0.08152,
    brightness_thresh: 0.15,
    event_thresh: 0.5,
    neighborhood: 50,
    frame_rate: 30,
    distance: 100,
    resolution: {
      width: 1280,
      height: 720
    },
    scale_fps: 30,
    scale_res: {
      r_width: 1280,
      r_height: 720
    },
    scale_dist: 100,
    scale_ruler_length: 30, 
    adjust_for_resolution: false,
    tlx: 250,
    tly: 0,
    trx: 1100,
    try: 0,
    blx: 250,
    bly: 680,
    brx: 1100,
    bry: 680
  };

  parameters = signal<ProcessingParameters>({ ...this.defaultParameters });

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.validate(file)) {
      this.selectedFile.set(file);
      this.errorMessage.set('');
      this.successMessage.set('');
    } else {
      this.errorMessage.set('Please select a valid video file');
      this.selectedFile.set(null);
    }
    event.target.value = '';
  }

  private validate(file: File): boolean {
    return file.type.startsWith('video/');
  }

  drawBoxSec() {
    if (this.processAlgo() == 'Sparse with bounding box') {
      return true;
    }
    return false;
  }
  enterCoordsSec() {
    if (this.boxType() == 'Enter coords') {
      return true;
    }
    return false;
  }
  
  upload() {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select a video file!');
      return;
    }

    this.isUploading.set(true);
    this.processingStatus.set('Preparing upload...');
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('processing_algo', this.processAlgo());
    formData.append('resolution_width', this.parameters().resolution.width.toString());
    formData.append('resolution_height', this.parameters().resolution.height.toString());
    formData.append('scale_resolution_width', this.parameters().scale_res.r_width.toString());
    formData.append('scale_resolution_height', this.parameters().scale_res.r_height.toString());
    
    Object.entries(this.parameters()).forEach(([key, value]) => {
      if (key !== 'resolution' && key !== 'scale_res') {
        formData.append(key, value.toString());
      } else if (key === 'scale_res') {
        formData.append('scale_res_width', value.r_width.toString());
        formData.append('scale_res_height', value.r_height.toString());
      }
    });

    let uploadComplete = false;

    this.http.post('http://127.0.0.1:5000/motion-analysis', formData, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            this.processingStatus.set(`Uploading... ${progress}%`);
          }
        } else if (event.type === HttpEventType.Response) {
          uploadComplete = true;
          const blob = event.body as Blob;
          const originalName = file.name;
          const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
          const downloadName = `${baseName}_motion_analysis.avi`;
          
          saveAs(blob, downloadName);
          
          this.successMessage.set('Video processed successfully and downloaded!');
          this.isUploading.set(false);
          this.processingStatus.set('');
          this.selectedFile.set(null);
          
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        } else if (event.type === HttpEventType.Sent) {
          // Upload is complete, now processing
          if (!uploadComplete) {
            this.processingStatus.set('Processing video... This may take a few minutes.');
          }
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage.set(error.error?.error || 'An error occurred during processing');
        this.isUploading.set(false);
        this.processingStatus.set('');
      }
    });
  }

  onParameterChange(param: string, value: any) {
    const currentParams = this.parameters();

    let parsed: any = value;
    if (value === 'true' || value === true) parsed = true;
    else if (value === 'false' || value === false) parsed = false;
    else if (!isNaN(parseFloat(value))) parsed = parseFloat(value);

    this.parameters.set({
      ...currentParams,
      [param]: parsed
    });
  }
  
  onBoxTypeChange(value: string) {
    this.boxType.set(value);
  }

  onProcessAlgoChange(value: string) {
    this.processAlgo.set(value);
  }

  onResolutionSelect(value: string) {
    const [width, height] = value.split('x').map(Number);

    if (!isNaN(width) && !isNaN(height)) {
      const currentParams = this.parameters();
      this.parameters.set({
        ...currentParams,
        resolution: { width, height }
      });
    }
  }

  onYesNo(value: string) {
    const currentParams = this.parameters();
    const boolValue = value === 'true';
    this.parameters.set({
      ...currentParams,
      adjust_for_resolution: boolValue
    });
  }


  resetToDefaults() {
    this.parameters.set({ ...this.defaultParameters });
  }
  
  constructor(private http: HttpClient) {
    // Single effect to handle all parameter updates
    effect(() => {
      const scale = this.scaleSignal();
      const incomingParams = this.vidParamsSignal();
      if (scale !== null || incomingParams) {
        const current = this.parameters();
        const newParams: ProcessingParameters = {
          ...current,
          ...(scale !== null && scale !== current.active_scale ? { active_scale: scale } : {}),
          ...(incomingParams ? {
            frame_rate: incomingParams.frame_rate,
            distance: incomingParams.distance,
            resolution: {
              width: incomingParams.resolution.width,
              height: incomingParams.resolution.height
            },
            scale_fps: incomingParams.frame_rate,
            scale_res: {
              r_width: incomingParams.resolution.width,
              r_height: incomingParams.resolution.height
            },
            scale_dist: incomingParams.distance
          } : {})
        };
        if (JSON.stringify(current) !== JSON.stringify(newParams)) {
          this.parameters.set(newParams);
        }
      }
    });
  }
}