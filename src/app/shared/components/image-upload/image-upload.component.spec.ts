import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';

describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.detectChanges();
  });

  it('shows upload button when no image', () => {
    expect(fixture.nativeElement.textContent).toContain('Subir imagen');
  });

  it('shows change and delete buttons when imageUrl is set', () => {
    fixture.componentRef.setInput('imageUrl', 'http://test.com/img.jpg');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cambiar imagen');
    expect(text).toContain('Eliminar');
  });

  it('shows image when imageUrl is set', () => {
    fixture.componentRef.setInput('imageUrl', 'http://test.com/img.jpg');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('test.com/img.jpg');
  });

  it('emits uploaded on file selection', () => {
    const spy = vi.fn();
    fixture.componentRef.instance.uploaded.subscribe(spy);
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { files: [file] } });
    fileInput.dispatchEvent(event);
    expect(spy).toHaveBeenCalledWith(file);
  });

  it('emits remove on remove button click', () => {
    fixture.componentRef.setInput('imageUrl', 'http://test.com/img.jpg');
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentRef.instance.remove.subscribe(spy);
    const el = fixture.nativeElement as HTMLElement;
    for (const b of el.querySelectorAll('app-button')) {
      if (b.textContent?.trim() === 'Eliminar') {
        b.querySelector('button')?.click();
        break;
      }
    }
    expect(spy).toHaveBeenCalled();
  });
});
