// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * UNEST — Fully on-chain token + generative NFT system (Uniswap v4)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Website : https://unest.fun/
 * Twitter : https://x.com/unest_fun
 *
 * UNEST is an ERC-20 token paired with fully on-chain generative NFT eggs
 * (pixel chicks). Every 100,000,000 UNEST of holding capacity mints one NFT.
 * Uniswap v4 swap fees (ETH) are split: 95% to NFT holders by rarity weight,
 * 3% to the official address, and 2% to buyback-and-burn. Liquidity is seeded
 * as a permanent token-only locked position.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { IPoolManager } from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import { IHooks } from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import { PoolKey } from "@uniswap/v4-core/src/types/PoolKey.sol";
import { Currency } from "@uniswap/v4-core/src/types/Currency.sol";
import { BalanceDelta } from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import { SafeCast } from "@uniswap/v4-core/src/libraries/SafeCast.sol";
import { ModifyLiquidityParams, SwapParams } from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {
    BeforeSwapDelta,
    BeforeSwapDeltaLibrary
} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";

/// @title LaunchGuardHook
/// @notice Uniswap v4 hook: validates the launch pool, buy credits, and fee collection triggers
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract LaunchGuardHook {
    using SafeCast for int128;

    error Unauthorized();
    error InvalidPool();
    error AlreadyInitialized();

    uint24 public constant POOL_FEE = 20_000;
    int24 public constant TICK_SPACING = 10;
    uint160 public constant INITIAL_SQRT_PRICE_X96 = 25_057_872_689_179_758_331_295_311_530_899_539;
    bytes32 private constant BUY_CREDIT_SLOT = keccak256("unest.buy.credit");

    IPoolManager public immutable poolManager;
    address public immutable locker;
    address public immutable token;
    address public immutable market;
    bool public initialized;
    bool private collecting;

    event FeesTriggered(address indexed router);

    constructor(address poolManager_, address locker_, address token_, address market_) {
        if (
            poolManager_ == address(0) || locker_ == address(0) || token_ == address(0)
                || market_ == address(0)
        ) {
            revert InvalidPool();
        }
        poolManager = IPoolManager(poolManager_);
        locker = locker_;
        token = token_;
        market = market_;
    }

    function beforeInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96)
        external
        returns (bytes4)
    {
        if (msg.sender != address(poolManager) || sender != locker) revert Unauthorized();
        if (initialized) revert AlreadyInitialized();
        _validatePool(key);
        if (sqrtPriceX96 != INITIAL_SQRT_PRICE_X96) revert InvalidPool();
        initialized = true;
        return this.beforeInitialize.selector;
    }

    function beforeSwap(address, PoolKey calldata key, SwapParams calldata, bytes calldata)
        external
        view
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        if (msg.sender != address(poolManager)) revert Unauthorized();
        _validatePool(key);
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function beforeAddLiquidity(
        address,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external view returns (bytes4) {
        if (msg.sender != address(poolManager)) {
            revert Unauthorized();
        }
        _validatePool(key);
        return this.beforeAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external view returns (bytes4) {
        if (msg.sender != address(poolManager)) {
            revert Unauthorized();
        }
        _validatePool(key);
        return this.beforeRemoveLiquidity.selector;
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4, int128) {
        if (msg.sender != address(poolManager)) revert Unauthorized();
        _validatePool(key);
        bool protocolSwap = sender == market && hookData.length == 1 && uint8(hookData[0]) == 1;
        if (params.zeroForOne && !protocolSwap) {
            int128 output = delta.amount1();
            if (output > 0) _addBuyCredit(output.toUint128());
        } else if (!params.zeroForOne && !protocolSwap && !collecting) {
            collecting = true;
            ILaunchGuardLocker(locker).collectFromHook();
            collecting = false;
            emit FeesTriggered(sender);
        }
        return (this.afterSwap.selector, 0);
    }

    function consumeBuyCredit(uint256 amount) external returns (uint256 authorized) {
        if (msg.sender != market) revert Unauthorized();
        bytes32 slot = BUY_CREDIT_SLOT;
        uint256 credit;
        assembly ("memory-safe") {
            credit := tload(slot)
        }
        authorized = amount < credit ? amount : credit;
        assembly ("memory-safe") {
            tstore(slot, sub(credit, authorized))
        }
    }

    function _addBuyCredit(uint256 amount) internal {
        bytes32 slot = BUY_CREDIT_SLOT;
        assembly ("memory-safe") {
            tstore(slot, add(tload(slot), amount))
        }
    }

    function _validatePool(PoolKey calldata key) internal view {
        if (
            Currency.unwrap(key.currency0) != address(0) || Currency.unwrap(key.currency1) != token
                || key.fee != POOL_FEE || key.tickSpacing != TICK_SPACING
                || address(key.hooks) != address(this)
        ) revert InvalidPool();
    }
}

interface ILaunchGuardLocker {
    function collectFromHook() external returns (uint256 tokenAmount, uint256 ethAmount);
}
