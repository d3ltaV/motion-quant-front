import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantifyMotion } from './quantify-motion';

describe('QuantifyMotion', () => {
  let component: QuantifyMotion;
  let fixture: ComponentFixture<QuantifyMotion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantifyMotion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantifyMotion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
