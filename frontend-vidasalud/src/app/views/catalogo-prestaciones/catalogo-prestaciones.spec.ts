import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoPrestaciones } from './catalogo-prestaciones';

describe('CatalogoPrestaciones', () => {
  let component: CatalogoPrestaciones;
  let fixture: ComponentFixture<CatalogoPrestaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoPrestaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogoPrestaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
