import { LOOP_STEPS } from '@/config/protocol';
import styles from './LoopSteps.module.css';

/** The whole protocol in four steps. There are no other steps. */
export function LoopSteps({ className }: { className?: string }) {
  return (
    <ol className={[styles.grid, className].filter(Boolean).join(' ')}>
      {LOOP_STEPS.map((step) => (
        <li key={step.n} className={styles.step}>
          <span className={styles.n}>{step.n}</span>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.body}>{step.body}</p>
          <span className={styles.tag}>{step.tag}</span>
        </li>
      ))}
    </ol>
  );
}

export default LoopSteps;
