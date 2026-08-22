import type { Metadata } from 'next';
import Section, { SectionHeader } from '@/components/ui/Section/Section';
import Badge from '@/components/ui/Badge/Badge';
import ContractList from '@/components/contracts/ContractList/ContractList';
import { ButtonLink } from '@/components/ui/Button/Button';
import { NETWORK_NAME, UNEST_ADDRESS, uniswapSwap } from '@/config/contracts';
import { MYTHIC_VALUES, TRAIT_CATEGORIES, TRAIT_VALUES } from '@/config/protocol';
import { DOC_SECTIONS, FAQ, RISKS, type DocBlock } from '@/lib/data/docs';
import { X_URL } from '@/config/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How UNEST works: automatic egg issuance, commit–reveal traits, on-chain art, the 95/3/2 fee split, reward weight, burns and risk.',
};

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case 'list':
      return (
        <ul className={styles.list}>
          {block.items?.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case 'code':
      return <pre className={styles.code}>{block.text}</pre>;
    case 'note':
      return (
        <aside className={[styles.callout, styles.note].join(' ')}>
          <span className={styles.calloutTag}>NOTE</span>
          <p>{block.text}</p>
        </aside>
      );
    case 'warn':
      return (
        <aside className={[styles.callout, styles.warn].join(' ')}>
          <span className={styles.calloutTag}>IMPORTANT</span>
          <p>{block.text}</p>
        </aside>
      );
    default:
      return <p className={styles.p}>{block.text}</p>;
  }
}

export default function DocsPage() {
  return (
    <>
      <Section size="md" width="narrow">
        <SectionHeader
          eyebrow="DOCUMENTATION"
          title="HOW IT WORKS"
          as="h1"
          lead={
            <p>
              Everything the contracts actually do, and nothing they do not. If this page and the
              Solidity disagree, the Solidity wins — it is in <code>/contracts</code>.
            </p>
          }
        />
        <div className={styles.badges}>
          <Badge tone="live" dot>
            {NETWORK_NAME}
          </Badge>
          <Badge tone="cosmic">FULLY ON-CHAIN ART</Badge>
        </div>
      </Section>

      {/* ---------------------------------------------------------- sections */}
      <Section size="sm" width="narrow">
        <div className={styles.doc}>
          {DOC_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <header className={styles.sectionHead}>
                <span className={styles.sectionIndex}>{section.index}</span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </header>
              <div className={styles.blocks}>
                {section.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </div>

              {section.id === 'contracts' ? <ContractList className={styles.contracts} /> : null}
            </section>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ traits */}
      <Section size="md" tone="sunken">
        <SectionHeader
          eyebrow="THE SIX TRAITS"
          title="TWELVE VALUES EACH"
          lead={
            <p>
              Drawn from the reveal seed. The last value of every trait is the mythic roll and
              carries the +75 bonus.
            </p>
          }
        />

        <div className={styles.traitGrid}>
          {TRAIT_CATEGORIES.map((cat) => (
            <div key={cat} className={styles.traitCard}>
              <h3 className={styles.traitName}>{cat}</h3>
              <ul className={styles.traitValues}>
                {TRAIT_VALUES[cat].map((v) => (
                  <li key={v} className={MYTHIC_VALUES[cat] === v ? styles.mythic : undefined}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------------- faq */}
      <Section size="md" width="narrow">
        <SectionHeader eyebrow="FAQ" title="COMMON QUESTIONS" />
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqQ}>
                <span className={styles.faqMark} aria-hidden="true">
                  ▸
                </span>
                {item.q}
              </summary>
              <p className={styles.faqA}>{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------------- risk */}
      <Section size="md" tone="sunken" width="narrow" id="risk">
        <SectionHeader
          eyebrow="BEFORE YOU TOUCH ANYTHING"
          title="RISK"
          lead={
            <p>
              UNEST is experimental software on {NETWORK_NAME}. Read this as if it were written for
              someone about to lose money, because it was.
            </p>
          }
        />

        <ul className={styles.risks}>
          {RISKS.map((r) => (
            <li key={r.title}>
              <span className={styles.riskTitle}>{r.title}</span>
              <span className={styles.riskBody}>{r.body}</span>
            </li>
          ))}
        </ul>

        <p className={styles.legal}>
          Nothing here is financial advice. UNEST is not a security, a fund or a yield product. No
          return of any size is promised at any time. The only accounts and addresses that belong to
          this project are the ones published on this site —{' '}
          <a href={X_URL} target="_blank" rel="noopener noreferrer">
            anything else is impersonation
          </a>
          . By using this interface you accept that you do so at your own risk.
        </p>

        <div className={styles.cta}>
          <ButtonLink href="/eggs" size="md" variant="secondary">
            YOUR EGGS
          </ButtonLink>
          <ButtonLink href={uniswapSwap(UNEST_ADDRESS)} external size="md" variant="ghost">
            BUY UNEST
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
