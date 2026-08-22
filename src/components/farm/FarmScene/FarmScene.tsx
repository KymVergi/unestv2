import styles from './FarmScene.module.css';

/**
 * The farm, repainted.
 *
 * Every colour below is taken from a palette in `UnestRenderer.sol` — the barn
 * is the Red shell, the wood is the Orange shell's shadow, the windmill sails
 * are Cream, the sun is Gold, the sky is the Void and Dusk backdrops. So the
 * scenery is literally made of the same colours as the chicks standing in it.
 *
 * Animation is deliberately cheap: transform and opacity only, no filters, no
 * animated noise. Everything stops under prefers-reduced-motion.
 */

/* ---- renderer palette --------------------------------------------------- */
const C = {
  skyTop: '#140a24', // Void backdrop
  skyMid: '#1a181f', // Dusk backdrop
  skyLow: '#1f1a10', // Gold backdrop
  sun: '#f2b705', // Gold fill
  sunCore: '#ffe58a', // Gold accent
  hillFar: '#241d33',
  hillNear: '#2a2035', // sealed-egg body colour
  field: '#1b3324',
  fieldDeep: '#12211a',
  grass: '#239b56', // Green shadow
  grassLit: '#58d68d', // Green fill
  barn: '#e74c3c', // Red fill
  barnLit: '#f1948a', // Red accent
  barnDark: '#922b21', // Red shadow
  wood: '#ba4a00', // Orange shadow
  woodLit: '#e67e22', // Orange fill
  cream: '#f5f0dc', // Cream fill
  creamDim: '#c9b896', // Cream shadow
  butter: '#f4d03f', // Butter fill
  cosmic: '#8e46ff',
  ink: '#0d0f11',
} as const;

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                */
/* -------------------------------------------------------------------------- */

function Mountain({
  x,
  base,
  w,
  h,
  fill,
  step = 3,
}: {
  x: number;
  base: number;
  w: number;
  h: number;
  fill: string;
  step?: number;
}) {
  const rows = Math.max(1, Math.floor(h / step));
  return (
    <g>
      {Array.from({ length: rows }, (_, i) => {
        const t = (i + 1) / rows;
        const rw = Math.max(2, Math.round(w * t));
        return (
          <rect
            key={i}
            x={Math.round(x + w / 2 - rw / 2)}
            y={base - h + i * step}
            width={rw}
            height={step}
            fill={fill}
          />
        );
      })}
    </g>
  );
}

function Cloud({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  const u = (n: number) => Math.round(n * s);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={u(4)} width={u(28)} height={u(5)} fill={fill} />
      <rect x={u(5)} y={0} width={u(13)} height={u(5)} fill={fill} />
      <rect x={u(16)} y={u(2)} width={u(9)} height={u(3)} fill={fill} />
    </g>
  );
}

function Tree({ x, base, s = 1 }: { x: number; base: number; s?: number }) {
  const u = (n: number) => Math.round(n * s);
  return (
    <g transform={`translate(${x} ${base})`}>
      <rect x={u(5)} y={u(-8)} width={u(3)} height={u(8)} fill={C.wood} />
      <rect x={0} y={u(-16)} width={u(13)} height={u(8)} fill={C.grass} />
      <rect x={u(2)} y={u(-22)} width={u(9)} height={u(6)} fill={C.grassLit} />
      <rect x={u(4)} y={u(-26)} width={u(5)} height={u(4)} fill={C.grassLit} />
    </g>
  );
}

function Fence({ x, base, segments }: { x: number; base: number; segments: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      {Array.from({ length: segments }, (_, i) => (
        <rect key={i} x={i * 10} y={-11} width={3} height={11} fill={C.woodLit} />
      ))}
      <rect x={0} y={-9} width={segments * 10} height={2} fill={C.wood} />
      <rect x={0} y={-4} width={segments * 10} height={2} fill={C.wood} />
    </g>
  );
}

function Crop({ x, base }: { x: number; base: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      <rect x={1} y={-6} width={1} height={6} fill={C.grass} />
      <rect x={0} y={-8} width={3} height={2} fill={C.butter} />
    </g>
  );
}

function Chicken({ x, base, flip = false }: { x: number; base: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${flip ? -1 : 1} 1)`} className={styles.peck}>
      <rect x={0} y={-7} width={7} height={5} fill={C.cream} />
      <rect x={5} y={-10} width={4} height={4} fill={C.cream} />
      <rect x={8} y={-8} width={2} height={1} fill={C.sun} />
      <rect x={7} y={-9} width={1} height={1} fill={C.ink} />
      <rect x={6} y={-11} width={2} height={1} fill={C.barn} />
      <rect x={1} y={-2} width={1} height={2} fill={C.sun} />
      <rect x={4} y={-2} width={1} height={2} fill={C.sun} />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Structures                                                                */
/* -------------------------------------------------------------------------- */

function Barn({ x, base }: { x: number; base: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      {Array.from({ length: 7 }, (_, i) => {
        const w = 14 + i * 6;
        return (
          <rect
            key={i}
            x={Math.round(26 - w / 2)}
            y={-40 + i * 2}
            width={w}
            height={2}
            fill={i % 2 === 0 ? C.barnDark : '#a83226'}
          />
        );
      })}
      <rect x={-1} y={-27} width={54} height={2} fill={C.ink} />
      <rect x={2} y={-25} width={48} height={25} fill={C.barn} />
      <rect x={2} y={-25} width={48} height={2} fill={C.barnLit} />
      <rect x={2} y={-4} width={48} height={4} fill={C.barnDark} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={2 + i * 6} y={-25} width={1} height={25} fill={C.barnDark} />
      ))}
      {/* door */}
      <rect x={17} y={-19} width={18} height={19} fill={C.ink} />
      <rect x={18} y={-18} width={16} height={18} fill={C.wood} />
      <rect x={25} y={-18} width={2} height={18} fill={C.ink} />
      <rect x={18} y={-10} width={16} height={1} fill={C.ink} />
      {/* hay loft window — the one lit thing on the farm */}
      <rect x={22} y={-33} width={8} height={7} fill={C.ink} />
      <rect x={23} y={-32} width={6} height={5} fill={C.sun} />
      {/* side windows */}
      <rect x={7} y={-21} width={6} height={5} fill={C.ink} />
      <rect x={8} y={-20} width={4} height={3} fill={C.sun} opacity={0.75} />
      <rect x={39} y={-21} width={6} height={5} fill={C.ink} />
      <rect x={40} y={-20} width={4} height={3} fill={C.sun} opacity={0.75} />
    </g>
  );
}

function Coop({ x, base }: { x: number; base: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      {Array.from({ length: 5 }, (_, i) => {
        const w = 8 + i * 5;
        return (
          <rect
            key={i}
            x={Math.round(14 - w / 2)}
            y={-24 + i * 2}
            width={w}
            height={2}
            fill={i % 2 === 0 ? C.wood : C.woodLit}
          />
        );
      })}
      <rect x={2} y={-14} width={24} height={14} fill={C.wood} />
      <rect x={2} y={-14} width={24} height={1} fill={C.woodLit} />
      <rect x={10} y={-9} width={8} height={9} fill={C.ink} />
      <rect x={18} y={-2} width={10} height={2} fill={C.woodLit} />
    </g>
  );
}

function Windmill({ x, base }: { x: number; base: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const w = 6 + i;
        return (
          <rect
            key={i}
            x={Math.round(9 - w / 2)}
            y={-4 - (12 - i) * 3}
            width={w}
            height={3}
            fill={i % 2 === 0 ? C.woodLit : C.wood}
          />
        );
      })}
      <rect x={0} y={-4} width={18} height={4} fill={C.ink} />
      <rect x={4} y={-43} width={10} height={4} fill={C.barnDark} />
      <rect x={6} y={-46} width={6} height={3} fill={C.barnDark} />
      <g transform="translate(9 -38)" className={styles.blades}>
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <rect x={-1} y={-26} width={2} height={22} fill={C.cream} />
            <rect x={1} y={-26} width={4} height={12} fill={C.creamDim} />
          </g>
        ))}
        <rect x={-2} y={-2} width={4} height={4} fill={C.ink} />
      </g>
    </g>
  );
}

function NestSpot({ x, base }: { x: number; base: number }) {
  return (
    <g transform={`translate(${x} ${base})`}>
      <rect x={0} y={-4} width={22} height={4} fill="#b7780b" />
      <rect x={2} y={-6} width={18} height={2} fill={C.sun} />
      <rect x={-2} y={-2} width={26} height={2} fill={C.wood} />
      {/* two eggs in the nest, in the shells the renderer actually uses */}
      <rect x={6} y={-10} width={4} height={4} fill={C.cream} />
      <rect x={11} y={-9} width={4} height={3} fill={C.cosmic} />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scene                                                                     */
/* -------------------------------------------------------------------------- */

export interface FarmSceneProps {
  className?: string;
}

const W = 320;
const H = 180;
const HORIZON = 128;

/**
 * Rendered once. The decorative layers live in a single `<g>` that CSS hides on
 * small screens — rendering a second "simple" copy would double the markup for
 * something only one of the two is ever visible.
 */
export function FarmScene({ className }: FarmSceneProps) {
  return (
    <svg
      className={[styles.scene, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="unestSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.skyTop} />
          <stop offset="55%" stopColor={C.skyMid} />
          <stop offset="100%" stopColor={C.skyLow} />
        </linearGradient>
        <linearGradient id="unestField" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.field} />
          <stop offset="100%" stopColor={C.fieldDeep} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={W} height={HORIZON} fill="url(#unestSky)" />

      {/* stars — static, no animation */}
      <g className={styles.decor}>
        {[
          [18, 12],
          [46, 26],
          [82, 9],
          [120, 21],
          [201, 14],
          [246, 8],
          [289, 24],
        ].map(([sx, sy], i) => (
          <rect key={i} x={sx} y={sy} width={1} height={1} fill={C.cream} opacity={0.5} />
        ))}
      </g>

      {/* sun */}
      <g>
        <rect x={236} y={54} width={22} height={22} fill={C.sun} />
        <rect x={232} y={58} width={30} height={14} fill={C.sun} />
        <rect x={240} y={50} width={14} height={30} fill={C.sun} />
        <rect x={240} y={58} width={10} height={10} fill={C.sunCore} />
      </g>

      <Mountain x={-10} base={HORIZON} w={110} h={54} fill={C.hillFar} />
      <Mountain x={64} base={HORIZON} w={130} h={70} fill={C.hillNear} />
      <Mountain x={186} base={HORIZON} w={150} h={48} fill={C.hillFar} />

      <g className={styles.decor}>
        <g className={styles.cloudA}>
          <Cloud x={-40} y={22} s={1.1} fill={C.hillNear} />
        </g>
        <g className={styles.cloudB}>
          <Cloud x={-40} y={48} s={0.8} fill={C.hillFar} />
        </g>
      </g>

      {/* field */}
      <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="url(#unestField)" />
      <rect x={0} y={HORIZON} width={W} height={2} fill={C.grass} />
      <rect x={0} y={HORIZON + 14} width={W} height={1} fill={C.grass} opacity={0.4} />

      {Array.from({ length: 3 }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={H - 20 + i * 6}
          width={W}
          height={2}
          fill={C.fieldDeep}
          opacity={0.5 + i * 0.15}
        />
      ))}

      <Tree x={4} base={HORIZON + 6} />
      <Coop x={22} base={HORIZON + 18} />
      <Barn x={112} base={HORIZON + 22} />
      <Windmill x={246} base={HORIZON + 16} />
      <Fence x={0} base={H - 4} segments={9} />

      <g className={styles.decor}>
        <Tree x={286} base={HORIZON + 4} s={0.85} />
        <Fence x={228} base={HORIZON + 16} segments={7} />
        {Array.from({ length: 14 }, (_, i) => (
          <Crop key={i} x={90 + i * 9} base={H - 6} />
        ))}
        <Chicken x={178} base={H - 10} flip />
      </g>

      <NestSpot x={196} base={HORIZON + 26} />
      <Chicken x={72} base={HORIZON + 20} />

      {/* dusk haze */}
      <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill={C.ink} opacity={0.22} />
    </svg>
  );
}

export default FarmScene;
