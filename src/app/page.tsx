import Section, { SectionHeader } from '@/components/ui/Section/Section';
import Badge from '@/components/ui/Badge/Badge';
import Card from '@/components/ui/Card/Card';
import { ButtonLink } from '@/components/ui/Button/Button';
import ChickMark from '@/components/egg/ChickMark/ChickMark';
import FarmScene from '@/components/farm/FarmScene/FarmScene';
import Furnace from '@/components/farm/Furnace/Furnace';
import LoopSteps from '@/components/protocol/LoopSteps/LoopSteps';
import FeeSplit from '@/components/protocol/FeeSplit/FeeSplit';
import LiveStats from '@/components/protocol/LiveStats/LiveStats';
import ContractList from '@/components/contracts/ContractList/ContractList';
import { NETWORK_SHORT, UNEST_ADDRESS, uniswapSwap } from '@/config/contracts';
import {
  BASE_REWARD_WEIGHT,
  MAX_EGGS,
  MAX_REWARD_WEIGHT,
  RARITY_TIERS,
  REVEAL_FEE,
  SUBTAGLINE,
  TAGLINE,
  TRAIT_CATEGORIES,
  UNIT,
} from '@/config/protocol';
import { compact, grouped } from '@/lib/utils/format';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className={styles.hero}>
        <div className={styles.heroScene} aria-hidden="true">
          <FarmScene />
          <span className={styles.heroFade} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge tone="live" dot className={styles.heroBadge}>
              {NETWORK_SHORT} · UNISWAP V4
            </Badge>

            <h1 className={styles.title}>UNEST</h1>
            <p className={styles.tagline}>{TAGLINE}</p>
            <p className={styles.lead}>{SUBTAGLINE}</p>

            <p className={styles.pitch}>
              Hold <strong>{compact(UNIT)} UNEST</strong> and an egg appears in your wallet. Nobody
              mints it for you — the token contract issues one the moment your balance can back it,
              and burns it the moment it cannot. Reveal the egg and it becomes a chick drawn
              entirely by the contract, earning a share of every swap fee in ETH.
            </p>

            <div className={styles.actions}>
              <ButtonLink href={uniswapSwap(UNEST_ADDRESS)} external size="lg">
                BUY UNEST
              </ButtonLink>
              <ButtonLink href="/eggs" size="lg" variant="secondary">
                YOUR EGGS
              </ButtonLink>
              <ButtonLink href="/docs" size="lg" variant="ghost">
                HOW IT WORKS
              </ButtonLink>
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <span className={styles.heroGlow} />
            <ChickMark
              className={styles.chick}
              animate
              fill="#f2b705"
              eye="#14171a"
              beak="#b7780b"
              feet="#8e46ff"
            />
            <span className={styles.heroCaption}>DRAWN BY UnestRenderer.sol</span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- stats */}
      <Section size="sm">
        <LiveStats />
      </Section>

      {/* ------------------------------------------------------------ loop */}
      <Section tone="sunken" size="md">
        <SectionHeader
          eyebrow="THE WHOLE PROTOCOL"
          title="FOUR STEPS. THAT IS ALL."
          lead={
            <p>
              There is no staking, no feeding, no breeding and no game to keep up with. You hold the
              token, you reveal the egg, you claim the ETH.
            </p>
          }
        />
        <LoopSteps />
      </Section>

      {/* ------------------------------------------------------------ fees */}
      <Section size="md">
        <div className={styles.split}>
          <div>
            <SectionHeader
              eyebrow="WHERE THE FEES GO"
              title="95% TO THE EGGS"
              lead={
                <p>
                  Swap fees arrive as ETH and are split by the token contract on the way in. The
                  holder slice is divided by <strong>reward weight</strong>, so a rarer chick takes
                  a larger share of the same pot.
                </p>
              }
            />
            <FeeSplit />
          </div>

          <Card title="REWARD WEIGHT" tone="cosmic" className={styles.weightCard}>
            <p className={styles.weightIntro}>
              Every revealed chick starts at <strong>{BASE_REWARD_WEIGHT}</strong>. Each of its six
              traits can add a bonus. The contract caps the total at{' '}
              <strong>{MAX_REWARD_WEIGHT}</strong>.
            </p>

            <ul className={styles.tiers}>
              {RARITY_TIERS.map((tier) => (
                <li key={tier.id} className={styles.tier}>
                  <span className={styles.tierLabel} style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                  <span className={styles.tierBonus}>
                    {tier.bonus === 0 ? '—' : `+${tier.bonus}`}
                  </span>
                  <span className={styles.tierNote}>{tier.note}</span>
                </li>
              ))}
            </ul>

            <p className={styles.weightFoot}>
              No rate is promised anywhere on this site. Rewards depend entirely on how much the
              pool is traded, and can be nothing.
            </p>
          </Card>
        </div>
      </Section>

      {/* ---------------------------------------------------------- on-chain */}
      <Section tone="sunken" size="md">
        <SectionHeader
          eyebrow="THE ART"
          title="NOTHING LIVES ON A SERVER"
          lead={
            <p>
              <strong>UnestRenderer.sol</strong> generates the SVG and the metadata as pure
              functions of the reveal seed. No IPFS pin, no image files, no API that can go down.
              This website only decodes what the contract already returns.
            </p>
          }
        />

        <div className={styles.traitGrid}>
          {TRAIT_CATEGORIES.map((cat) => (
            <div key={cat} className={styles.traitCard}>
              <span className={styles.traitName}>{cat}</span>
              <span className={styles.traitCount}>12 VALUES</span>
            </div>
          ))}
        </div>

        <p className={styles.traitFoot}>
          Six traits, twelve values each. The twelfth of every trait is the mythic roll and carries
          the largest bonus.
        </p>
      </Section>

      {/* -------------------------------------------------------- scarcity */}
      <Section size="md">
        <div className={styles.scarcity}>
          <div className={styles.furnaceCol}>
            <Furnace label="The furnace burning UNEST" />
            <span className={styles.furnaceLabel}>THE FURNACE</span>
          </div>

          <div className={styles.mathRow}>
            <div className={styles.mathCell}>
              <span className={styles.mathValue}>{grouped(100_000_000_000)}</span>
              <span className={styles.mathLabel}>UNEST SUPPLY</span>
            </div>
            <span className={styles.op}>÷</span>
            <div className={styles.mathCell}>
              <span className={styles.mathValue}>{grouped(UNIT)}</span>
              <span className={styles.mathLabel}>PER EGG</span>
            </div>
            <span className={styles.op}>=</span>
            <div className={[styles.mathCell, styles.mathResult].join(' ')}>
              <span className={styles.mathValue}>{grouped(MAX_EGGS)}</span>
              <span className={styles.mathLabel}>EGGS, AT MOST</span>
            </div>
          </div>

          <p className={styles.scarcityNote}>
            {grouped(MAX_EGGS)} is a ceiling, not a supply. Every reveal burns {compact(REVEAL_FEE)}{' '}
            UNEST and the buyback burns more, so the number of eggs the supply can support only
            falls. It never goes up.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------------- contracts */}
      <Section tone="sunken" size="md">
        <SectionHeader
          eyebrow="VERIFY EVERYTHING"
          title="THE SIX CONTRACTS"
          lead={<p>Check each one on Etherscan before you touch anything.</p>}
        />
        <ContractList />

        <div className={styles.cta}>
          <ButtonLink href="/docs" size="md" variant="secondary">
            READ THE DOCS
          </ButtonLink>
          <ButtonLink href="/eggs" size="md" variant="ghost">
            OPEN YOUR WALLET
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
