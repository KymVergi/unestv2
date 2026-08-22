import type { Metadata } from 'next';
import Section, { SectionHeader } from '@/components/ui/Section/Section';
import EggsDashboard from '@/components/egg/EggsDashboard/EggsDashboard';
import { REVEAL_BLOCKHASH_WINDOW, REVEAL_FEE, UNIT } from '@/config/protocol';
import { compact } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Your Eggs',
  description:
    'Your UNEST eggs, read straight from the contract. Reveal them and claim your share of swap fees in ETH.',
};

export default function EggsPage() {
  return (
    <Section width="wide" size="md">
      <SectionHeader
        eyebrow="YOUR WALLET"
        title="YOUR EGGS"
        lead={
          <p>
            One egg per <strong>{compact(UNIT)} UNEST</strong> you hold. Reveal burns{' '}
            <strong>{compact(REVEAL_FEE)} UNEST</strong> and must happen within{' '}
            {REVEAL_BLOCKHASH_WINDOW} blocks of the target — past that, reveal again to book a new
            one.
          </p>
        }
      />
      <EggsDashboard />
    </Section>
  );
}
