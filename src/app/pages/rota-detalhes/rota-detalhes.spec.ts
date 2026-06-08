import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotaDetalhes } from './rota-detalhes';

describe('RotaDetalhes', () => {
  let component: RotaDetalhes;
  let fixture: ComponentFixture<RotaDetalhes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaDetalhes],
    }).compileComponents();

    fixture = TestBed.createComponent(RotaDetalhes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
