import { fireEvent, render, screen } from '@testing-library/react';
import { Dropzone } from '@/components/ui/dropzone';

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

describe('Dropzone', () => {
  it('hands over a file chosen with the picker', () => {
    const onFile = vi.fn();
    const { container } = render(<Dropzone onFile={onFile}>Drop here</Dropzone>);
    const file = new File(['x'], 'a.png');

    fireEvent.change(fileInput(container), { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('opens the picker when the zone is clicked, and can be reached by keyboard (it is a real button)', () => {
    const { container } = render(<Dropzone onFile={vi.fn()}>Drop here</Dropzone>);
    const click = vi.spyOn(fileInput(container), 'click');

    const zone = screen.getByRole('button', { name: 'Drop here' });
    zone.focus();
    expect(zone).toHaveFocus();
    fireEvent.click(zone);

    expect(click).toHaveBeenCalled();
  });

  it('accepts a dropped file and highlights while one is dragged over', () => {
    const onFile = vi.fn();
    render(<Dropzone onFile={onFile}>Drop here</Dropzone>);
    const zone = screen.getByRole('button');
    const file = new File(['x'], 'a.png');

    fireEvent.dragEnter(zone);
    expect(zone.className).toContain('bg-pencil-50');

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
    expect(zone.className).not.toContain('bg-pencil-50');
  });

  it('ignores drops while disabled', () => {
    const onFile = vi.fn();
    render(
      <Dropzone onFile={onFile} disabled>
        Drop here
      </Dropzone>,
    );
    fireEvent.drop(screen.getByRole('button'), {
      dataTransfer: { files: [new File(['x'], 'a.png')] },
    });
    expect(onFile).not.toHaveBeenCalled();
  });
});
