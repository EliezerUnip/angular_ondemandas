import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mapa-embed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-embed.html',
  styleUrl: './mapa-embed.css'
})
export class MapaEmbed implements OnChanges {
  @Input() endereco: string = 'Umuarama PR';
  mapaUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.atualizarMapa();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['endereco']) {
      this.atualizarMapa();
    }
  }

  private atualizarMapa(): void {
    const q = encodeURIComponent(this.endereco.trim());
    const url =
      `https://www.google.com/maps/embed/v1/place?key=${environment.googleMapsEmbedApiKey}&q=${q}`;

    this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
