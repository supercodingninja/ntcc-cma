// ==========================================================================
// This Area Of Code Is: The living Earth orb.
// Explanation: A REAL rotating globe, rendered frame-by-frame from your
// earth image — the same sphere-mapping math a 3D engine uses: the surface
// turns around the vertical axis, the far side mirrors around, starfield
// and all, exactly like the GIF. No CSS trickery — an actual 24-frame
// rotating earth, playing as a lightweight animated image inside a glass
// gold-ringed mask. Reduced-motion users get the resting globe (the
// animation simply never starts for them via CSS covering).
// In Other Words: The world turns the way the world actually turns.
// ==========================================================================

export default function EarthOrb({ size = 40 }: { size?: number; tiltDeg?: number }) {
  return (
    <span
      className="earth-orb"
      style={{ width: size, height: size }}
      role="img" aria-label="Rotating earth"
    >
      <img src="/earth-spin.webp" alt="" aria-hidden="true" draggable={false}
           className="earth-orb-anim" />
      <img src="/earth-still.png" alt="" aria-hidden="true" draggable={false}
           className="earth-orb-still" />
    </span>
  );
}
