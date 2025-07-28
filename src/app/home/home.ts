import { ChangeDetectionStrategy, Component, signal} from '@angular/core';
import { QuantifyMotion } from '../home-components/quantify-motion/quantify-motion';
import { FindScaling } from '../home-components/find-scaling/find-scaling';
@Component({
  selector: 'app-home',
  imports: [
    QuantifyMotion, 
    FindScaling
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {

    scaleForMotionAnalysis = signal<number>(0.08152); // default
    
    vidParamsForMotion = signal<any>({
      frame_rate: 30,
      distance: 100,
      resolution: {
        width: 1280,
        height: 720
      }
    });
    
    onScaleAndParams({ scale, params }: { scale: number, params: any }) {
        this.scaleForMotionAnalysis.set(scale);
        this.vidParamsForMotion.set(params);
        console.log('Updated scale:', scale);
        console.log('Updated params:', params);
    }

}