import type { FrameInfo } from '../../shared/types';

interface Props {
  frame: FrameInfo;
}

export function FramePreview({ frame }: Props) {
  return (
    <div className="frame-info">
      <div className="frame-icon">🖼️</div>
      <div className="frame-details">
        <h3>{frame.name}</h3>
        <span>
          {frame.width} × {frame.height}px
        </span>
      </div>
    </div>
  );
}
