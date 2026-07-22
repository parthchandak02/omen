import { useRef, useCallback, useState, useEffect } from "react";
import { ToolcraftApp } from "@/toolcraft/runtime/react";

import { appComposition } from "../app/app-composition";

export function AppHome(): React.JSX.Element {
  const [stampText, setStampText] = useState('Agify + Genderize + Nationalize · prediction · loading...');
  const [heroText, setHeroText] = useState('--');

  // Listen for data updates from the canvas
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.stamp) setStampText(detail.stamp);
      if (detail.age !== undefined) setHeroText(`${Math.round(detail.age)}`);
    };
    window.addEventListener('omen-data-update', handler);
    return () => window.removeEventListener('omen-data-update', handler);
  }, []);

  return (
    <div className="relative w-full h-full">
      <ToolcraftApp
        canvasContent={appComposition.canvasContent}
        className="h-dvh min-h-dvh"
        controlRenderers={appComposition.controlRenderers}
        onPanelAction={appComposition.onPanelAction}
        renderDefaultCanvasMedia={false}
        schema={appComposition.schema}
      />

      {/* Hero number */}
      <div id="hero" style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 100,
        textAlign: 'right',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: '#ff6d00',
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1,
          textShadow: '0 0 40px rgba(255,109,0,0.4)',
        }}>
          {heroText}
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'system-ui, sans-serif',
          marginTop: 2,
        }}>
          predicted age (years)
        </div>
      </div>

      {/* Data stamp */}
      <div id="stamp" style={{
        position: 'fixed',
        bottom: 20,
        left: 16,
        zIndex: 100,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        letterSpacing: '0.5px',
      }}>
        {stampText}
      </div>

      {/* Legend */}
      <div id="legend" style={{
        position: 'fixed',
        bottom: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        textAlign: 'center',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        <span><span style={{ color: '#4fc3f7' }}>●</span> height = age</span>
        <span><span style={{ color: '#4fc3f7' }}>━</span> <span style={{ color: '#f48fb1' }}>━</span> gender split</span>
        <span>◉ nationality bars</span>
      </div>

      {/* Description */}
      <div id="desc" style={{
        position: 'fixed',
        bottom: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        textAlign: 'center',
        maxWidth: '65ch',
      }}>
        Type a name to see its predicted persona — age, gender, and nationality from live prediction APIs. Tap for details.
      </div>
    </div>
  );
}
