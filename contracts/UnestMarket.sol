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
import { IPoolManager } from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import { IUnlockCallback } from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import { IHooks } from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import { PoolKey } from "@uniswap/v4-core/src/types/PoolKey.sol";
import { Currency } from "@uniswap/v4-core/src/types/Currency.sol";
import { BalanceDelta } from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import { SwapParams } from "@uniswap/v4-core/src/types/PoolOperation.sol";
import { TickMath } from "@uniswap/v4-core/src/libraries/TickMath.sol";
import { StateLibrary } from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import { SafeCast } from "@uniswap/v4-core/src/libraries/SafeCast.sol";
import { IBuybackExecutor } from "@Unest/interfaces/IBuybackExecutor.sol";
import { IFeeConverter } from "@Unest/interfaces/IFeeConverter.sol";

interface IUnestMarketToken is IERC20 {
    function recordBuy(address buyer, uint256 amount) external returns (uint256);
    function recordSell(address seller, uint256 amount) external returns (uint256);
}

interface IUnestBuyCredit {
    function consumeBuyCredit(uint256 amount) external returns (uint256 authorized);
}

/// @title UnestMarket
/// @notice Buy/sell router over the Uniswap v4 pool; also runs buybacks and fee conversion
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract UnestMarket is IUnlockCallback, IBuybackExecutor, IFeeConverter {
    using SafeERC20 for IERC20;
    using StateLibrary for IPoolManager;
    using SafeCast for int128;
    using SafeCast for uint256;

    error Unauthorized();
    error InvalidAddress();
    error AlreadyInitialized();
    error NotInitialized();
    error DeadlineExpired();
    error InvalidAmount();
    error InsufficientOutput();
    error InvalidDelta();
    error TransferFailed();

    uint24 public constant POOL_FEE = 20_000;
    int24 public constant TICK_SPACING = 10;

    IPoolManager public immutable poolManager;
    IHooks public immutable launchGuardHook;
    address public initializer;
    IUnestMarketToken public token;
    address public locker;

    bool private active;

    event Initialized(address indexed token, address indexed locker);
    event Buy(address indexed payer, address indexed recipient, uint256 ethIn, uint256 tokenOut);
    event Sell(address indexed payer, address indexed recipient, uint256 tokenIn, uint256 ethOut);

    struct CallbackData {
        address payer;
        address recipient;
        bool zeroForOne;
        uint256 amountIn;
        uint256 minAmountOut;
        uint160 sqrtPriceLimitX96;
        bool protocolSwap;
    }

    constructor(address poolManager_, address initializer_, address launchGuardHook_) {
        if (
            poolManager_ == address(0) || initializer_ == address(0)
                || launchGuardHook_ == address(0)
        ) revert InvalidAddress();
        poolManager = IPoolManager(poolManager_);
        launchGuardHook = IHooks(launchGuardHook_);
        initializer = initializer_;
    }

    receive() external payable {
        if (msg.sender != address(poolManager)) revert Unauthorized();
    }

    function initialize(address token_, address locker_) external {
        if (msg.sender != initializer) revert Unauthorized();
        if (address(token) != address(0)) revert AlreadyInitialized();
        if (token_ == address(0) || locker_ == address(0)) revert InvalidAddress();
        token = IUnestMarketToken(token_);
        locker = locker_;
        initializer = address(0);
        emit Initialized(token_, locker_);
    }

    function poolKey() public view returns (PoolKey memory) {
        if (address(token) == address(0)) revert NotInitialized();
        return PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(address(token)),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: launchGuardHook
        });
    }

    function isSystem(address account) external view returns (bool) {
        return account == address(this) || account == address(poolManager) || account == locker
            || account == address(launchGuardHook);
    }

    function consumeBuyCredit(uint256 amount) external returns (uint256 authorized) {
        if (msg.sender != address(token)) revert Unauthorized();
        return IUnestBuyCredit(address(launchGuardHook)).consumeBuyCredit(amount);
    }

    function buy(uint256 minTokenOut, address recipient, uint256 deadline)
        external
        payable
        returns (uint256 tokenOut)
    {
        if (deadline < block.timestamp) revert DeadlineExpired();
        if (msg.value == 0 || minTokenOut == 0 || recipient == address(0)) revert InvalidAmount();
        (uint256 spent, uint256 received) = _swap(
            CallbackData({
                payer: msg.sender,
                recipient: recipient,
                zeroForOne: true,
                amountIn: msg.value,
                minAmountOut: minTokenOut,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1,
                protocolSwap: false
            })
        );
        token.recordBuy(recipient, received);
        uint256 refund = msg.value - spent;
        if (refund != 0) _sendEth(msg.sender, refund);
        emit Buy(msg.sender, recipient, spent, received);
        return received;
    }

    function sell(uint256 tokenIn, uint256 minEthOut, address recipient, uint256 deadline)
        external
        returns (uint256 ethOut)
    {
        if (deadline < block.timestamp) revert DeadlineExpired();
        if (tokenIn == 0 || minEthOut == 0 || recipient == address(0)) revert InvalidAmount();
        (uint256 spent, uint256 received) = _swap(
            CallbackData({
                payer: msg.sender,
                recipient: recipient,
                zeroForOne: false,
                amountIn: tokenIn,
                minAmountOut: minEthOut,
                sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1,
                protocolSwap: false
            })
        );
        token.recordSell(msg.sender, spent);
        emit Sell(msg.sender, recipient, spent, received);
        return received;
    }

    function buy(address token_, address recipient) external payable {
        if (msg.sender != address(token) || token_ != address(token) || msg.value == 0) {
            revert Unauthorized();
        }
        (uint256 spent, uint256 received) = _swap(
            CallbackData({
                payer: address(this),
                recipient: recipient,
                zeroForOne: true,
                amountIn: msg.value,
                minAmountOut: 1,
                sqrtPriceLimitX96: _protocolLimit(true),
                protocolSwap: true
            })
        );
        if (spent != msg.value || received == 0) revert InsufficientOutput();
        token.recordBuy(recipient, received);
        emit Buy(address(token), recipient, msg.value, received);
    }

    function convert(address token_, uint256 amount, address recipient) external {
        _convert(token_, amount, recipient, false);
    }

    function convertUnlocked(address token_, uint256 amount, address recipient) external {
        _convert(token_, amount, recipient, true);
    }

    function _convert(address token_, uint256 amount, address recipient, bool managerUnlocked)
        internal
    {
        if (msg.sender != locker || token_ != address(token)) revert Unauthorized();
        if (amount == 0 || recipient == address(0)) revert InvalidAmount();
        CallbackData memory data = CallbackData({
            payer: msg.sender,
            recipient: recipient,
            zeroForOne: false,
            amountIn: amount,
            minAmountOut: 1,
            sqrtPriceLimitX96: _protocolLimit(false),
            protocolSwap: true
        });
        (uint256 spent, uint256 received) = managerUnlocked ? _executeSwap(data) : _swap(data);
        if (spent != amount) revert InsufficientOutput();
        emit Sell(msg.sender, recipient, spent, received);
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        if (msg.sender != address(poolManager) || !active) revert Unauthorized();
        CallbackData memory data = abi.decode(rawData, (CallbackData));
        (uint256 spent, uint256 received) = _executeSwap(data);
        return abi.encode(spent, received);
    }

    function _executeSwap(CallbackData memory data)
        internal
        returns (uint256 spent, uint256 received)
    {
        bytes memory hookData = data.protocolSwap ? abi.encodePacked(uint8(1)) : new bytes(0);
        BalanceDelta delta = poolManager.swap(
            poolKey(),
            SwapParams({
                zeroForOne: data.zeroForOne,
                amountSpecified: -int256(data.amountIn),
                sqrtPriceLimitX96: data.sqrtPriceLimitX96
            }),
            hookData
        );
        int128 inputDelta = data.zeroForOne ? delta.amount0() : delta.amount1();
        int128 outputDelta = data.zeroForOne ? delta.amount1() : delta.amount0();
        if (inputDelta >= 0 || outputDelta <= 0) revert InvalidDelta();
        spent = (-inputDelta).toUint128();
        received = outputDelta.toUint128();
        if (received < data.minAmountOut) revert InsufficientOutput();
        if (data.zeroForOne) {
            poolManager.settle{ value: spent }();
            poolManager.take(Currency.wrap(address(token)), data.recipient, received);
        } else {
            poolManager.sync(Currency.wrap(address(token)));
            IERC20(address(token)).safeTransferFrom(data.payer, address(poolManager), spent);
            poolManager.settle();
            poolManager.take(Currency.wrap(address(0)), data.recipient, received);
        }
    }

    function _swap(CallbackData memory data) internal returns (uint256 spent, uint256 received) {
        if (address(token) == address(0)) revert NotInitialized();
        if (active) revert Unauthorized();
        active = true;
        (spent, received) = abi.decode(poolManager.unlock(abi.encode(data)), (uint256, uint256));
        active = false;
    }

    function _protocolLimit(bool zeroForOne) internal view returns (uint160) {
        PoolKey memory key = poolKey();
        (uint160 current,,,) = poolManager.getSlot0(key.toId());
        if (zeroForOne) {
            uint160 limit = uint160(uint256(current) * 95 / 100);
            return limit > TickMath.MIN_SQRT_PRICE ? limit : TickMath.MIN_SQRT_PRICE + 1;
        }
        uint256 upper = uint256(current) * 105 / 100;
        return upper < TickMath.MAX_SQRT_PRICE ? upper.toUint160() : TickMath.MAX_SQRT_PRICE - 1;
    }

    function _sendEth(address recipient, uint256 amount) internal {
        (bool success,) = recipient.call{ value: amount }("");
        if (!success) revert TransferFailed();
    }
}
