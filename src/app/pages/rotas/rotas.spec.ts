import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rotas } from './rotas';

describe('Rotas', () => {
  let component: Rotas;
  let fixture: ComponentFixture<Rotas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rotas],
    }).compileComponents();

    fixture = TestBed.createComponent(Rotas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
