import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaEmbed } from './mapa-embed';

describe('MapaEmbed', () => {
  let component: MapaEmbed;
  let fixture: ComponentFixture<MapaEmbed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaEmbed],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaEmbed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
