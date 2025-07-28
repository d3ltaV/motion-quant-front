import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindScaling } from './find-scaling';

describe('FindScaling', () => {
  let component: FindScaling;
  let fixture: ComponentFixture<FindScaling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindScaling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindScaling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
