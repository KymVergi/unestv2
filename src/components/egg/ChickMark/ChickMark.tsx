import styles from './ChickMark.module.css';

/**
 * The chick, drawn with the exact path data from `UnestRenderer.sol`.
 *
 * These constants are copied verbatim from the contract, so the illustration
 * on this site is the same silhouette the chain produces — not an artist's
 * impression of it.
 */
const CHICK =
  'M28 18H36V20H28ZM26 20H38V22H26ZM24 22H40V24H24ZM22 24H42V26H22ZM20 26H44V38H20ZM20 38H44V40H20ZM22 40H42V42H22ZM24 42H40V44H24ZM26 44H38V46H26Z';
const CHICK_ARMS = 'M18 30H20V34H18ZM44 30H46V34H44';
const CHICK_FEET = 'M26 46H28V48H26ZM34 46H36V48H34';
const BEAK = 'M30 32H34V34H32V36H30Z';

export interface ChickMarkProps {
  /** Body fill. Defaults to the sealed-egg colour from the renderer. */
  fill?: string;
  eye?: string;
  beak?: string;
  feet?: string;
  backdrop?: string;
  className?: string;
  /** A gentle idle bob. Off under prefers-reduced-motion. */
  animate?: boolean;
  title?: string;
}

export function ChickMark({
  fill = '#2a2035',
  eye = '#4a6741',
  beak = '#3d3020',
  feet = '#111111',
  backdrop = 'transparent',
  className,
  animate = false,
  title,
}: ChickMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      shapeRendering="crispEdges"
      className={[styles.svg, animate ? styles.animate : '', className].filter(Boolean).join(' ')}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {backdrop !== 'transparent' ? <rect width="64" height="64" fill={backdrop} /> : null}
      <path d={CHICK} fill={fill} />
      <path d={CHICK_ARMS} fill={fill} />
      <path d={CHICK_FEET} fill={feet} />
      <rect x="27" y="28" width="2" height="2" fill={eye} />
      <rect x="33" y="28" width="2" height="2" fill={eye} />
      <path d={BEAK} fill={beak} />
    </svg>
  );
}

export default ChickMark;
