import styles from './Furnace.module.css';

/**
 * The furnace. Every UNEST that leaves circulation — reveal fees and the
 * buyback — goes in here. Colours are the renderer's Orange and Red shells.
 */
export function Furnace({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <svg
        viewBox="0 0 40 44"
        shapeRendering="crispEdges"
        className={styles.svg}
        role="img"
        aria-label={label ?? 'A pixel furnace burning UNEST'}
      >
        {/* chimney */}
        <rect x={24} y={0} width={7} height={9} fill="#ba4a00" />
        <rect x={23} y={2} width={9} height={2} fill="#8b3800" />
        {/* body */}
        <rect x={4} y={9} width={32} height={31} fill="#ba4a00" />
        <rect x={4} y={9} width={32} height={2} fill="#e67e22" />
        <rect x={4} y={38} width={32} height={2} fill="#8b3800" />
        <rect x={2} y={40} width={36} height={4} fill="#0d0f11" />
        {[14, 20, 26, 32].map((y) => (
          <rect key={y} x={4} y={y} width={32} height={1} fill="#8b3800" />
        ))}
        {/* mouth */}
        <rect x={10} y={16} width={20} height={18} fill="#0d0f11" />
        {/* fire */}
        <g className={styles.fire}>
          <rect x={12} y={26} width={16} height={7} fill="#922b21" />
          <rect x={14} y={22} width={12} height={5} fill="#e74c3c" />
          <rect x={16} y={19} width={8} height={4} fill="#f2b705" />
          <rect x={18} y={17} width={4} height={3} fill="#ffe58a" />
        </g>
        {/* grate */}
        {[13, 17, 21, 25].map((x) => (
          <rect key={x} x={x} y={33} width={1} height={2} fill="#0d0f11" />
        ))}
      </svg>
    </div>
  );
}

export default Furnace;
