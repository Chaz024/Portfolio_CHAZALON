import { useEffect, useState, type ReactNode } from 'react';

/* Révélation « encre » : un lavis orange balaie le contenu via un
   clip-path circulaire dont le bord est rendu organique par un filtre
   SVG feTurbulence + feDisplacementMap (défini dans PlaneViewer).
   Le filtre est retiré une fois l'animation terminée pour que le
   texte redevienne net. */

export default function InkReveal({
  children,
  reveal,
  reduced,
}: {
  children: ReactNode;
  /** change de valeur pour rejouer la révélation */
  reveal: string;
  reduced: boolean;
}) {
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(false), [reveal]);

  if (reduced) {
    return <div className="ink-plain">{children}</div>;
  }
  return (
    <div
      key={reveal}
      className={settled ? 'ink ink-done' : 'ink'}
      onAnimationEnd={(e) => {
        if (e.animationName === 'ink-grow') setSettled(true);
      }}
    >
      <div className="ink-clip">
        <div className="ink-wash" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
