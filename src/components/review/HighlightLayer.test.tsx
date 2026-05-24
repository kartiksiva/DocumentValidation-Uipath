import { render } from '@testing-library/react';
import HighlightLayer from './HighlightLayer';
import type { Finding } from '../../types/review';

describe('HighlightLayer', () => {
  it('renders without crashing when no active finding', () => {
    const { container } = render(
      <div id="doc-panel">
        <HighlightLayer panelId="doc-panel" activeFinding={null} findings={[]} />
      </div>
    );
    expect(container).toBeTruthy();
  });
});
