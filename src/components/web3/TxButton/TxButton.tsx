'use client';

import { useEffect } from 'react';
import type { Abi } from 'viem';
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { mainnet } from 'wagmi/chains';
import Icon from '@/components/ui/Icon/Icon';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button/Button';
import { NOT_CONFIGURED, etherscanTx } from '@/config/contracts';
import { TARGET_CHAIN } from '@/lib/web3/config';
import styles from './TxButton.module.css';

export interface TxButtonProps {
  label: string;
  /** Empty string means the contract is not configured. */
  address: string;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  /** A protocol-level reason the action is unavailable, e.g. "NOT READY YET". */
  blockedReason?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  onConfirmed?: () => void;
}

/**
 * One on-chain action, with the real lifecycle: simulate → write → receipt.
 *
 * Neither `reveal` nor `claim` pulls UNEST through an allowance — the token
 * burns the reveal fee itself from inside the call — so there is no approve
 * step to run here, and none is invented.
 *
 * Nothing is ever faked: no simulated transaction, no fabricated hash, no
 * confirmation that did not happen on chain.
 */
export function TxButton({
  label,
  address,
  abi,
  functionName,
  args = [],
  blockedReason,
  variant = 'secondary',
  size = 'sm',
  full = true,
  onConfirmed,
}: TxButtonProps) {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();

  const configured = address.length > 0;
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const canSimulate = configured && isConnected && !wrongNetwork && !blockedReason;

  const { data: simulation, error: simulationError } = useSimulateContract({
    address: configured ? (address as `0x${string}`) : undefined,
    abi: abi as Abi,
    functionName,
    args: args as readonly unknown[],
    account,
    chainId: mainnet.id,
    query: { enabled: canSimulate },
  });

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: receiptFailed,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) onConfirmed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  let state: string | null = null;
  let tone = styles.info;

  if (!configured) {
    state = NOT_CONFIGURED;
    tone = styles.warnState;
  } else if (!isConnected) {
    state = 'CONNECT WALLET';
  } else if (wrongNetwork) {
    state = 'WRONG NETWORK';
    tone = styles.warnState;
  } else if (blockedReason) {
    state = blockedReason;
    tone = styles.warnState;
  } else if (isPending) {
    state = 'CONFIRM IN WALLET';
  } else if (isConfirming) {
    state = 'PENDING';
  } else if (isSuccess) {
    state = 'CONFIRMED';
    tone = styles.okState;
  } else if (receiptFailed || writeError) {
    state = 'FAILED';
    tone = styles.failState;
  } else if (simulationError) {
    state = 'WOULD REVERT';
    tone = styles.failState;
  }

  const busy = isPending || isConfirming;
  const disabled = !canSimulate || busy || !simulation;
  const explorer = etherscanTx(hash);

  return (
    <div className={styles.wrap}>
      <Button
        variant={variant}
        size={size}
        full={full}
        disabled={disabled}
        onClick={() => {
          reset();
          if (simulation) writeContract(simulation.request);
        }}
      >
        {busy ? <Icon name="spinner" size={10} className={styles.spin} /> : null}
        {label}
      </Button>

      {state ? (
        <span className={[styles.state, tone].join(' ')}>
          {state}
          {explorer && (isConfirming || isSuccess) ? (
            <a href={explorer} target="_blank" rel="noopener noreferrer" className={styles.txLink}>
              TX <Icon name="external" size={9} />
            </a>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default TxButton;
