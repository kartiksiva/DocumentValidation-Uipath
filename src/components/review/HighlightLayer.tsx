import { useEffect, useRef } from 'react';
import Mark from 'mark.js';
import type { Finding } from '../../types/review';

const HIGHLIGHT_CLASSES: Record<string, string> = {
  'high-risk': 'bg-red-100 border-b-2 border-red-400',
  'medium-risk': 'bg-amber-100 border-b-2 border-amber-400',
  aligned: 'bg-green-100 border-b-2 border-green-400',
  missing: 'bg-red-100 border-b-2 border-red-400 border-dashed',
  modified: 'bg-amber-100 border-b-2 border-amber-400',
  extra: 'bg-blue-100 border-b-2 border-blue-400',
};

interface Props {
  panelId: string;
  findings: Finding[];
  activeFinding: Finding | null;
}

export default function HighlightLayer({ panelId, findings, activeFinding }: Props) {
  const markerRef = useRef<Mark | null>(null);

  useEffect(() => {
    const el = document.getElementById(panelId);
    if (!el) return;
    markerRef.current = new Mark(el);
  }, [panelId]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.unmark();

    findings.forEach(finding => {
      const snippet = finding.snippetA;
      if (!snippet) return;
      const cls = `${HIGHLIGHT_CLASSES[finding.deviationType] ?? ''} ${activeFinding?.id === finding.id ? 'ring-2 ring-blue-400' : ''}`.trim();
      marker.mark(snippet, {
        separateWordSearch: false,
        accuracy: 'complementary',
        className: cls,
        element: 'mark',
      });
    });
  }, [findings, activeFinding]);

  useEffect(() => {
    if (!activeFinding) return;
    const el = document.getElementById(panelId);
    if (!el) return;
    const marked = el.querySelector('mark');
    if (marked) marked.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeFinding, panelId]);

  return null;
}
