import { Component, input, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-profile-blueprint',
  template: `
    <div [innerHTML]="svg()" class="h-full w-full"></div>
  `,
  styles: [`
    :host { display: block; }
    :host svg { max-width: 100%; max-height: 100%; }
  `],
})
export class ProfileBlueprintComponent {
  private readonly sanitizer = inject(DomSanitizer);

  shapeType = input.required<string>();
  familyCode = input<string>();

  readonly svg = computed<SafeHtml>(() => {
    const inner = this.innerSvg();
    if (!inner) return '';
    return this.sanitizer.bypassSecurityTrustHtml(wrapBlueprintSvg(inner));
  });

  private innerSvg(): string | null {
    switch (this.shapeType()) {
      case 'I': case 'H': return iSvg;
      case 'U': return uSvg;
      case 'C': return cSvg;
      case 'L': return lSvg;
      case 'T': return tSvg;
      case 'CHS': return chsSvg;
      case 'RHS': return rhsSvg;
      case 'SHS': return shsSvg;
      default: return null;
    }
  }
}

function wrapBlueprintSvg(inner: string): string {
  return `\
<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8d6e5" stroke-width="0.5" />
    </pattern>
    <pattern id="ch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
    </pattern>
    <marker id="al" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 -4 L 10 0 L 0 4 Z" fill="#1e3a5f" />
    </marker>
    <marker id="ar" viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 10 -4 L 0 0 L 10 4 Z" fill="#1e3a5f" />
    </marker>
    <marker id="au" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 -4 L 10 0 L 0 4 Z" fill="#1e3a5f" />
    </marker>
    <marker id="ad" viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 10 -4 L 0 0 L 10 4 Z" fill="#1e3a5f" />
    </marker>
  </defs>
  <rect width="260" height="260" fill="#f0f4f8" rx="8" />
  <rect width="260" height="260" fill="url(#g)" rx="8" />
  ${inner}
</svg>`;
}

const iSvg = `
<rect x="55" y="40" width="150" height="28" rx="6" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="55" y="40" width="150" height="28" rx="6" fill="url(#ch)" />
<rect x="110" y="68" width="40" height="124" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="110" y="68" width="40" height="124" rx="4" fill="url(#ch)" />
<rect x="55" y="192" width="150" height="28" rx="6" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="55" y="192" width="150" height="28" rx="6" fill="url(#ch)" />
<line x1="35" y1="54" x2="35" y2="206" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="225" y1="54" x2="225" y2="206" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="35" y1="28" x2="225" y2="28" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="22" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="235" y1="40" x2="235" y2="220" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="238" y="133" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
<line x1="105" y1="235" x2="155" y2="235" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="250" text-anchor="middle" fill="#1e3a5f" font-size="12" font-family="monospace" font-weight="bold">t<sub>w</sub></text>
<line x1="218" y1="45" x2="218" y2="63" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="212" y="38" text-anchor="end" fill="#1e3a5f" font-size="12" font-family="monospace" font-weight="bold">t<sub>f</sub></text>
`;

const uSvg = `
<rect x="55" y="40" width="28" height="180" rx="5" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="55" y="40" width="28" height="180" rx="5" fill="url(#ch)" />
<rect x="83" y="40" width="122" height="24" rx="5" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="83" y="40" width="122" height="24" rx="5" fill="url(#ch)" />
<rect x="83" y="196" width="122" height="24" rx="5" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="83" y="196" width="122" height="24" rx="5" fill="url(#ch)" />
<line x1="35" y1="52" x2="35" y2="208" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="225" y1="52" x2="225" y2="208" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="35" y1="28" x2="225" y2="28" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="22" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="230" y1="40" x2="230" y2="220" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="233" y="133" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
`;

const cSvg = uSvg;

const lSvg = `
<rect x="60" y="40" width="24" height="140" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="60" y="40" width="24" height="140" rx="4" fill="url(#ch)" />
<rect x="84" y="156" width="116" height="24" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="84" y="156" width="116" height="24" rx="4" fill="url(#ch)" />
<line x1="40" y1="52" x2="40" y2="168" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="40" y1="28" x2="220" y2="28" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="22" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="230" y1="40" x2="230" y2="190" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="233" y="118" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
`;

const tSvg = `
<rect x="55" y="40" width="150" height="28" rx="6" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="55" y="40" width="150" height="28" rx="6" fill="url(#ch)" />
<rect x="110" y="68" width="40" height="120" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="110" y="68" width="40" height="120" rx="4" fill="url(#ch)" />
<line x1="35" y1="54" x2="35" y2="200" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="225" y1="54" x2="225" y2="200" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="4,3" />
<line x1="35" y1="28" x2="225" y2="28" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="22" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="235" y1="40" x2="235" y2="200" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="238" y="123" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
`;

const chsSvg = `
<circle cx="130" cy="130" r="72" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<circle cx="130" cy="130" r="72" fill="none" stroke="#1e3a5f" stroke-width="1" stroke-dasharray="6,4" />
<circle cx="130" cy="130" r="46" fill="url(#ch)" />
<line x1="130" y1="38" x2="130" y2="222" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="133" y="133" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">D</text>
<line x1="38" y1="130" x2="222" y2="130" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="123" text-anchor="end" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">D</text>
<line x1="198" y1="95" x2="198" y2="165" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="201" y="133" text-anchor="start" fill="#1e3a5f" font-size="12" font-family="monospace" font-weight="bold">t</text>
`;

const rhsSvg = `
<rect x="60" y="50" width="140" height="160" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="60" y="50" width="140" height="160" rx="4" fill="url(#ch)" />
<rect x="80" y="70" width="100" height="120" rx="2" fill="#f0f4f8" stroke="#1e3a5f" stroke-width="1.5" stroke-dasharray="6,3" />
<line x1="30" y1="120" x2="55" y2="120" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="25" y="116" text-anchor="end" fill="#1e3a5f" font-size="12" font-family="monospace" font-weight="bold">t</text>
<line x1="60" y1="25" x2="200" y2="25" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="19" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="215" y1="50" x2="215" y2="210" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="218" y="133" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
`;

const shsSvg = `
<rect x="50" y="50" width="160" height="160" rx="4" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2.5" />
<rect x="50" y="50" width="160" height="160" rx="4" fill="url(#ch)" />
<rect x="75" y="75" width="110" height="110" rx="2" fill="#f0f4f8" stroke="#1e3a5f" stroke-width="1.5" stroke-dasharray="6,3" />
<line x1="25" y1="120" x2="45" y2="120" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="20" y="116" text-anchor="end" fill="#1e3a5f" font-size="12" font-family="monospace" font-weight="bold">t</text>
<line x1="50" y1="30" x2="210" y2="30" stroke="#1e3a5f" stroke-width="1" marker-start="url(#al)" marker-end="url(#ar)" />
<text x="130" y="24" text-anchor="middle" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">b</text>
<line x1="225" y1="50" x2="225" y2="210" stroke="#1e3a5f" stroke-width="1" marker-start="url(#au)" marker-end="url(#ad)" />
<text x="228" y="133" text-anchor="start" fill="#1e3a5f" font-size="13" font-family="monospace" font-weight="bold">h</text>
`;
