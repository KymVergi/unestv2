import ChickMark from '@/components/egg/ChickMark/ChickMark';
import { ButtonLink } from '@/components/ui/Button/Button';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <div className={styles.art}>
        <ChickMark fill="#2a2035" eye="#4a6741" beak="#3d3020" feet="#111111" />
      </div>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>NOTHING HATCHED HERE</h1>
      <p className={styles.text}>This page does not exist. The egg is still sealed.</p>
      <div className={styles.actions}>
        <ButtonLink href="/" size="lg">
          BACK HOME
        </ButtonLink>
        <ButtonLink href="/docs" size="lg" variant="ghost">
          READ THE DOCS
        </ButtonLink>
      </div>
    </div>
  );
}
