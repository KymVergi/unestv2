'use client';

import { useAccount, useBalance, useBlockNumber, useChainId, useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import Icon from '@/components/ui/Icon/Icon';
import Badge from '@/components/ui/Badge/Badge';
import Stat, { StatGrid } from '@/components/ui/Stat/Stat';
import { Button, ButtonLink } from '@/components/ui/Button/Button';
import ConnectWallet from '@/components/web3/ConnectWallet/ConnectWallet';
import TxButton from '@/components/web3/TxButton/TxButton';
import EggCard from '@/components/egg/EggCard/EggCard';
import { NOT_CONFIGURED, UNEST_ADDRESS, isConfigured, uniswapSwap } from '@/config/contracts';
import { REVEAL_FEE, TOKEN_DECIMALS, UNIT } from '@/config/protocol';
import { claimAllAbi, pendingRewardByAccountAbi, unestAbi } from '@/lib/web3/abis';
import { useEggs } from '@/lib/web3/useEggs';
import { TARGET_CHAIN } from '@/lib/web3/config';
import { compact, formatEth, formatUnits, plural, toWholeTokens } from '@/lib/utils/format';
import styles from './EggsDashboard.module.css';

export function EggsDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;

  const token = isConfigured(UNEST_ADDRESS) ? UNEST_ADDRESS : undefined;

  const { data: blockNumber } = useBlockNumber({ chainId: mainnet.id, watch: true });

  const { data: unestBalance, refetch: refetchBalance } = useReadContract({
    address: token,
    abi: unestAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mainnet.id,
    query: { enabled: Boolean(token && address) },
  });

  const { data: pendingTotal, refetch: refetchPending } = useReadContract({
    address: token,
    abi: pendingRewardByAccountAbi,
    functionName: 'pendingReward',
    args: address ? [address] : undefined,
    chainId: mainnet.id,
    query: { enabled: Boolean(token && address) },
  });

  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
    query: { enabled: Boolean(address) },
  });

  const nest = useEggs(address, blockNumber ? Number(blockNumber) : 0);

  function refreshAll() {
    nest.refetch();
    void refetchBalance();
    void refetchPending();
  }

  /* ---- gates ------------------------------------------------------------ */
  if (!isConnected) {
    return (
      <div className={styles.gate}>
        <span className={styles.gateIcon}>
          <Icon name="wallet" size={30} />
        </span>
        <h2 className={styles.gateTitle}>CONNECT TO SEE YOUR EGGS</h2>
        <p className={styles.gateText}>
          Eggs follow your UNEST balance. Connect a wallet on {TARGET_CHAIN.name} and this page
          reads them straight from the contract — nothing is stored here.
        </p>
        <ConnectWallet />
        <ButtonLink href="/docs" size="sm" variant="ghost" className={styles.gateLink}>
          HOW IT WORKS
        </ButtonLink>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className={[styles.gate, styles.gateWarn].join(' ')}>
        <span className={[styles.gateIcon, styles.gateIconWarn].join(' ')}>
          <Icon name="alert" size={30} />
        </span>
        <h2 className={styles.gateTitle}>WRONG NETWORK</h2>
        <p className={styles.gateText}>UNEST lives on {TARGET_CHAIN.name}.</p>
        <ConnectWallet />
      </div>
    );
  }

  if (!token || !nest.configured) {
    return (
      <div className={styles.gate}>
        <span className={styles.gateIcon}>
          <Icon name="alert" size={30} />
        </span>
        <h2 className={styles.gateTitle}>{NOT_CONFIGURED}</h2>
        <p className={styles.gateText}>
          The contract addresses have not been published to this site yet. Nothing can be read until
          they are, and nothing will be guessed in the meantime.
        </p>
      </div>
    );
  }

  /* ---- derived ---------------------------------------------------------- */
  const balanceWei = unestBalance ?? 0n;
  const balanceWhole = toWholeTokens(balanceWei, TOKEN_DECIMALS);
  const capacity = Math.floor(balanceWhole / UNIT);
  const held = nest.eggs.length;

  const unitWei = BigInt(UNIT) * 10n ** BigInt(TOKEN_DECIMALS);
  const feeWei = BigInt(REVEAL_FEE) * 10n ** BigInt(TOKEN_DECIMALS);
  /** `payRevealFee` requires balance ≥ eggsHeld × UNIT + REVEAL_FEE. */
  const requiredForReveal = BigInt(nest.total) * unitWei + feeWei;
  const canPayRevealFee = balanceWei >= requiredForReveal;
  const shortfallWei = canPayRevealFee ? 0n : requiredForReveal - balanceWei;

  const sealed = nest.eggs.filter((e) => !e.revealed);
  const readyToReveal = sealed.filter((e) => e.state === 'ready').length;
  const revealed = held - sealed.length;
  const totalWeight = nest.eggs.reduce((sum, e) => sum + e.weight, 0);
  const pending = pendingTotal ?? 0n;

  return (
    <div className={styles.wrap}>
      <div className={styles.statusRow}>
        <Badge tone="live" dot>
          {nest.isLoading ? 'READING CHAIN' : 'LIVE'}
        </Badge>
        <Badge tone="sky">{TARGET_CHAIN.name}</Badge>
        {nest.truncated ? (
          <Badge tone="gold">
            SHOWING {held} OF {nest.total}
          </Badge>
        ) : null}
        <Button size="sm" variant="ghost" onClick={refreshAll}>
          REFRESH
        </Button>
      </div>

      <StatGrid columns={4} className={styles.stats}>
        <Stat
          accent="gold"
          size="sm"
          value={unestBalance === undefined ? '····' : compact(balanceWhole)}
          label="UNEST BALANCE"
          hint={`${compact(UNIT)} backs one egg`}
        />
        <Stat
          accent={capacity < held ? 'sky' : 'cosmic'}
          size="sm"
          value={nest.total}
          label={plural(nest.total, 'EGG')}
          hint={`capacity ${capacity}`}
        />
        <Stat
          accent="plain"
          size="sm"
          value={`${revealed} / ${held}`}
          label="REVEALED"
          hint={readyToReveal ? `${readyToReveal} ready now` : 'weight ' + totalWeight}
        />
        <Stat
          accent="green"
          size="sm"
          value={pendingTotal === undefined ? '····' : `${formatEth(pending)} ETH`}
          label="CLAIMABLE"
          hint={
            ethBalance
              ? `wallet ${formatUnits(ethBalance.value, ethBalance.decimals, 3)} ${ethBalance.symbol}`
              : undefined
          }
        />
      </StatGrid>

      {!canPayRevealFee && sealed.length > 0 ? (
        <p className={styles.warning}>
          <Icon name="alert" size={12} />
          Revealing needs your full backing <em>plus</em> the {compact(REVEAL_FEE)} UNEST fee. You
          are {formatUnits(shortfallWei, TOKEN_DECIMALS, 0)} UNEST short — buy a little more, or an
          egg will be burned to pay for it.
        </p>
      ) : null}

      <div className={styles.claimRow}>
        <div>
          <span className={styles.claimLabel}>ALL EGGS AT ONCE</span>
          <span className={styles.claimValue}>{formatEth(pending)} ETH</span>
        </div>
        <TxButton
          label="CLAIM EVERYTHING"
          variant="primary"
          size="md"
          full={false}
          address={UNEST_ADDRESS}
          abi={claimAllAbi}
          functionName="claim"
          blockedReason={pending === 0n ? 'NOTHING TO CLAIM' : undefined}
          onConfirmed={refreshAll}
        />
      </div>

      {nest.isLoading && held === 0 ? <p className={styles.loading}>READING YOUR EGGS…</p> : null}

      {!nest.isLoading && held === 0 ? (
        <div className={styles.empty}>
          <Icon name="egg" size={34} />
          <h3>NO EGGS YET</h3>
          <p>
            Eggs are issued automatically. The moment your balance reaches {compact(UNIT)} UNEST,
            one appears here — no minting step, no transaction to send.
          </p>
          <ButtonLink href={uniswapSwap(UNEST_ADDRESS)} external size="sm">
            BUY UNEST
          </ButtonLink>
        </div>
      ) : null}

      <div className={styles.grid}>
        {nest.eggs.map((egg) => (
          <EggCard
            key={egg.tokenId}
            egg={egg}
            canPayRevealFee={canPayRevealFee}
            onDone={refreshAll}
          />
        ))}
      </div>

      {held > 0 ? (
        <p className={styles.foot}>
          Every action here is a real transaction you sign, simulated against the contract first.
          Selling or sending UNEST below your backing burns eggs automatically — that is the token
          contract doing it, not this website.
        </p>
      ) : null}
    </div>
  );
}

export default EggsDashboard;
