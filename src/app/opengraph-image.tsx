import { ImageResponse } from 'next/og';

export const alt = 'UNEST — hold the token, hatch the chick';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The social card, drawn from the same path data as `UnestRenderer.sol`.
 * Satori does not render <path>, so the chick is rebuilt here as the stacked
 * 2px rows the contract's path describes — same silhouette, same grid.
 */
const BODY: [number, number, number, number][] = [
  // x, y, width, height — in the contract's 64×64 space
  [28, 18, 8, 2],
  [26, 20, 12, 2],
  [24, 22, 16, 2],
  [22, 24, 20, 2],
  [20, 26, 24, 12],
  [20, 38, 24, 2],
  [22, 40, 20, 2],
  [24, 42, 16, 2],
  [26, 44, 12, 2],
];
const ARMS: [number, number, number, number][] = [
  [18, 30, 2, 4],
  [44, 30, 2, 4],
];
const FEET: [number, number, number, number][] = [
  [26, 46, 2, 2],
  [34, 46, 2, 2],
];
const EYES: [number, number, number, number][] = [
  [27, 28, 2, 2],
  [33, 28, 2, 2],
];
const BEAK: [number, number, number, number][] = [
  [30, 32, 4, 2],
  [30, 34, 2, 2],
];

const U = 7; // scale: 64 × 7 = 448px tall chick

function Pixels({ rects, color }: { rects: [number, number, number, number][]; color: string }) {
  return (
    <>
      {rects.map(([x, y, w, h], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x * U,
            top: y * U,
            width: w * U,
            height: h * U,
            background: color,
            display: 'flex',
          }}
        />
      ))}
    </>
  );
}

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#0d0f11',
        borderBottom: '8px solid #f2b705',
        boxSizing: 'border-box',
      }}
    >
      {/* copy */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 64px',
          width: 760,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 7,
            color: '#bb86fc',
            marginBottom: 18,
          }}
        >
          ETHEREUM · UNISWAP V4
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 116,
            fontWeight: 700,
            letterSpacing: 4,
            color: '#eceadf',
            lineHeight: 1,
          }}
        >
          UNEST
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#f2b705',
            marginTop: 24,
            letterSpacing: 1,
          }}
        >
          HOLD THE TOKEN. HATCH THE CHICK.
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 21,
            color: '#9aa1a9',
            marginTop: 20,
            letterSpacing: 1,
          }}
        >
          100M UNEST = 1 on-chain egg · 95% of fees to holders
        </div>
      </div>

      {/* the chick */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 315 - (64 * U) / 2,
          width: 64 * U,
          height: 64 * U,
          display: 'flex',
        }}
      >
        <Pixels rects={BODY} color="#f2b705" />
        <Pixels rects={ARMS} color="#f2b705" />
        <Pixels rects={FEET} color="#8e46ff" />
        <Pixels rects={BEAK} color="#b7780b" />
        <Pixels rects={EYES} color="#14171a" />
      </div>
    </div>,
    size,
  );
}
