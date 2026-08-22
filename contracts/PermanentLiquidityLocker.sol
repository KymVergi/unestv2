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

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IPoolManager } from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import { IUnlockCallback } from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import { IHooks } from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import { PoolKey } from "@uniswap/v4-core/src/types/PoolKey.sol";
import { Currency } from "@uniswap/v4-core/src/types/Currency.sol";
import { BalanceDelta } from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import { ModifyLiquidityParams } from "@uniswap/v4-core/src/types/PoolOperation.sol";
import { TickMath } from "@uniswap/v4-core/src/libraries/TickMath.sol";
import { LiquidityAmounts } from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";
import { SafeCast } from "@uniswap/v4-core/src/libraries/SafeCast.sol";
import { IFeeConverter } from "@Unest/interfaces/IFeeConverter.sol";
import { IUnestFees } from "@Unest/interfaces/IUnestFees.sol";

/// @title PermanentLiquidityLocker
/// @notice Seeds and permanently locks the Uniswap v4 LP; routes collected fees to UNEST
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract PermanentLiquidityLocker is IUnlockCallback, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeCast for int128;

    error Unauthorized();
    error InvalidAddress();
    error InvalidAmount();
    error AlreadyInitialized();

    uint24 public constant POOL_FEE = 20_000;
    int24 public constant TICK_SPACING = 10;
    int24 public constant TICK_LOWER = 150_000;
    int24 public constant TICK_UPPER = 253_300;

    IPoolManager public immutable poolManager;
    IERC20 public immutable unest;
    IFeeConverter public immutable feeConverter;
    IHooks public immutable launchGuardHook;
    address public initializer;

    uint128 public liquidity;
    uint256 public tokenReserve;
    uint256 public ethReserve;
    bool public initialized;
    bool private active;

    event LiquidityLocked(uint128 liquidity, uint256 tokenAmount, uint256 ethAmount);
    event FeesCollected(uint256 tokenAmount, uint256 ethAmount);
    event ConversionDeferred(uint256 tokenAmount);

    struct CallbackData {
        uint128 liquidityAmount;
    }

    constructor(
        address poolManager_,
        address unest_,
        address feeConverter_,
        address initializer_,
        address launchGuardHook_
    ) {
        if (
            poolManager_ == address(0) || unest_ == address(0) || feeConverter_ == address(0)
                || initializer_ == address(0) || launchGuardHook_ == address(0)
        ) revert InvalidAddress();
        poolManager = IPoolManager(poolManager_);
        unest = IERC20(unest_);
        feeConverter = IFeeConverter(feeConverter_);
        launchGuardHook = IHooks(launchGuardHook_);
        initializer = initializer_;
    }

    receive() external payable { }

    function poolKey() public view returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(address(unest)),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: launchGuardHook
        });
    }

    function initialize(uint256 tokenAmount, uint160 sqrtPriceX96)
        external
        payable
        nonReentrant
        returns (uint128 lockedLiquidity)
    {
        if (msg.sender != initializer) revert Unauthorized();
        if (initialized) revert AlreadyInitialized();
        unest.safeTransferFrom(msg.sender, address(this), tokenAmount);
        return _initialize(tokenAmount, sqrtPriceX96);
    }

    function initializePreFunded(uint256 tokenAmount, uint160 sqrtPriceX96)
        external
        payable
        nonReentrant
        returns (uint128 lockedLiquidity)
    {
        if (msg.sender != initializer) revert Unauthorized();
        if (initialized) revert AlreadyInitialized();
        if (unest.balanceOf(address(this)) < tokenAmount) revert InvalidAmount();
        return _initialize(tokenAmount, sqrtPriceX96);
    }

    function _initialize(uint256 tokenAmount, uint160 sqrtPriceX96)
        internal
        returns (uint128 lockedLiquidity)
    {
        if (tokenAmount == 0 || msg.value != 0) revert InvalidAmount();
        initialized = true;
        initializer = address(0);
        PoolKey memory key = poolKey();
        poolManager.initialize(key, sqrtPriceX96);
        lockedLiquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            TickMath.getSqrtPriceAtTick(TICK_LOWER),
            TickMath.getSqrtPriceAtTick(TICK_UPPER),
            msg.value,
            tokenAmount
        );
        if (lockedLiquidity == 0) revert InvalidAmount();
        liquidity = lockedLiquidity;
        _unlock(CallbackData({ liquidityAmount: lockedLiquidity }));
        tokenReserve = unest.balanceOf(address(this));
        ethReserve = address(this).balance;
        emit LiquidityLocked(lockedLiquidity, tokenAmount, msg.value - ethReserve);
    }

    function collect() external nonReentrant returns (uint256 tokenAmount, uint256 ethAmount) {
        return _collect(false);
    }

    function collectFromHook()
        external
        nonReentrant
        returns (uint256 tokenAmount, uint256 ethAmount)
    {
        if (msg.sender != address(launchGuardHook)) revert Unauthorized();
        return _collect(true);
    }

    function _collect(bool managerUnlocked)
        internal
        returns (uint256 tokenAmount, uint256 ethAmount)
    {
        if (!initialized) revert Unauthorized();
        uint256 tokenBefore = unest.balanceOf(address(this));
        if (managerUnlocked) {
            _modifyAndResolve(0);
        } else {
            _unlock(CallbackData({ liquidityAmount: 0 }));
        }
        tokenAmount = unest.balanceOf(address(this)) - tokenBefore;
        uint256 convertible = unest.balanceOf(address(this)) - tokenReserve;
        if (convertible != 0) {
            unest.forceApprove(address(feeConverter), convertible);
            if (managerUnlocked) {
                try feeConverter.convertUnlocked(address(unest), convertible, address(this)) { }
                catch {
                    emit ConversionDeferred(convertible);
                }
            } else {
                try feeConverter.convert(address(unest), convertible, address(this)) { }
                catch {
                    emit ConversionDeferred(convertible);
                }
            }
            unest.forceApprove(address(feeConverter), 0);
        }
        uint256 distributable = address(this).balance - ethReserve;
        ethAmount = distributable;
        if (distributable != 0) {
            IUnestFees(address(unest)).depositFees{ value: distributable }();
        }
        emit FeesCollected(tokenAmount, ethAmount);
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        if (msg.sender != address(poolManager) || !active) revert Unauthorized();
        CallbackData memory data = abi.decode(rawData, (CallbackData));
        _modifyAndResolve(data.liquidityAmount);
        return bytes("");
    }

    function _modifyAndResolve(uint128 liquidityAmount) internal {
        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            poolKey(),
            ModifyLiquidityParams({
                tickLower: TICK_LOWER,
                tickUpper: TICK_UPPER,
                liquidityDelta: int256(uint256(liquidityAmount)),
                salt: bytes32(0)
            }),
            bytes("")
        );
        _resolve(Currency.wrap(address(0)), delta.amount0());
        _resolve(Currency.wrap(address(unest)), delta.amount1());
    }

    function lockedBalances()
        external
        view
        returns (uint256 tokenBalance, uint256 ethBalance, uint128 lockedLiquidity)
    {
        tokenBalance = tokenReserve;
        ethBalance = ethReserve;
        lockedLiquidity = liquidity;
    }

    function _unlock(CallbackData memory data) internal {
        if (active) revert Unauthorized();
        active = true;
        poolManager.unlock(abi.encode(data));
        active = false;
    }

    function _resolve(Currency currency, int128 delta) internal {
        if (delta < 0) {
            uint256 amount = (-delta).toUint128();
            if (Currency.unwrap(currency) == address(0)) {
                poolManager.settle{ value: amount }();
            } else {
                poolManager.sync(currency);
                unest.safeTransfer(address(poolManager), amount);
                poolManager.settle();
            }
        } else if (delta > 0) {
            poolManager.take(currency, address(this), delta.toUint128());
        }
    }
}
