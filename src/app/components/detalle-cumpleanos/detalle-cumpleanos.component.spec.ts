import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCumpleanosComponent } from './detalle-cumpleanos.component';

describe('DetalleCumpleanosComponent', () => {
  let component: DetalleCumpleanosComponent;
  let fixture: ComponentFixture<DetalleCumpleanosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleCumpleanosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleCumpleanosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
