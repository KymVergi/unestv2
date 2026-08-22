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

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { UnestNFT } from "@Unest/UnestNFT.sol";
import { UnestRenderer } from "@Unest/UnestRenderer.sol";
import { IUnestController } from "@Unest/interfaces/IUnestController.sol";
import { IBuybackExecutor } from "@Unest/interfaces/IBuybackExecutor.sol";

interface IUnestSystemRegistry {
    function isSystem(address account) external view returns (bool);

    function consumeBuyCredit(uint256 amount) external returns (uint256 authorized);
}

/// @title Unest
/// @notice ERC-20 token controller: NFT mint/burn sync, fee split, buybacks, reveals
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract Unest is ERC20, ReentrancyGuard, IUnestController {
    error Unauthorized();
    error InvalidAddress();
    error TransferFailed();
    error BuybackFailed();
    error InsufficientRevealBalance();

    uint256 public constant INITIAL_SUPPLY = 100_000_000_000 ether;
    uint256 public constant UNIT = 100_000_000 ether;
    uint256 public constant REVEAL_FEE = 2_000_000 ether;
    uint256 public constant FEE_RATE = 20_000;
    uint256 public constant FEE_DENOMINATOR = 1_000_000;
    uint256 public constant HOLDER_SHARE = 95;
    uint256 public constant OFFICIAL_SHARE = 3;
    uint256 public constant BUYBACK_SHARE = 2;
    uint256 public constant BASE_REWARD_WEIGHT = 100;
    uint256 public constant MAX_REWARD_WEIGHT = 300;
    uint256 private constant ACCURACY = 1e36;

    address public immutable market;
    address public immutable settlement;
    address public immutable official;
    IBuybackExecutor public immutable buybackExecutor;
    UnestRenderer public immutable renderer;
    UnestNFT public immutable nft;

    uint256 public accRewardPerWeight;
    uint256 public totalRewardWeight;
    uint256 public holderDistributionRemainder;
    uint256 public buybackRewardRemainder;
    uint256 public pendingOfficial;
    uint256 public pendingBuyback;
    uint256 public redirectedBuybackTotal;

    mapping(uint256 => uint256) public nftRewardWeight;
    mapping(uint256 => uint256) public nftRewardDebt;
    mapping(uint256 => uint256) public nftRewardRemainder;
    mapping(uint256 => uint256) public nftClaimable;

    bool private backingTransfer;

    event MarketBuy(address indexed buyer, uint256 amount, uint256 minted);
    event MarketSell(address indexed seller, uint256 amount, uint256 burned);
    event NftMoved(address indexed from, address indexed to, uint256 indexed tokenId);
    event NftBurned(address indexed owner, uint256 indexed tokenId);
    event NftWeightUpdated(uint256 indexed tokenId, uint256 oldWeight, uint256 newWeight);
    event RevealFeeBurned(uint256 indexed tokenId, address indexed payer, uint256 amount);
    event NftRewardClaimed(uint256 indexed tokenId, address indexed account, uint256 amount);
    event NftRewardRedirected(uint256 indexed tokenId, uint256 amount);
    event FeesDeposited(
        uint256 amount, uint256 holderAmount, uint256 officialAmount, uint256 buybackAmount
    );
    event RewardClaimed(address indexed account, uint256 amount);
    event OfficialExecuted(uint256 amount);
    event OfficialDeferred(uint256 amount);
    event BuybackExecuted(uint256 ethAmount, uint256 tokenAmount);
    event BuybackDeferred(uint256 amount);

    constructor(
        address initialRecipient,
        address market_,
        address settlement_,
        address official_,
        address collectionOwner_,
        address buybackExecutor_,
        address renderer_,
        uint256 revealDelay
    ) ERC20("UNEST", "UNEST") {
        if (
            initialRecipient == address(0) || market_ == address(0) || settlement_ == address(0)
                || official_ == address(0) || collectionOwner_ == address(0)
                || buybackExecutor_ == address(0) || renderer_ == address(0)
        ) revert InvalidAddress();
        market = market_;
        settlement = settlement_;
        official = official_;
        buybackExecutor = IBuybackExecutor(buybackExecutor_);
        renderer = UnestRenderer(renderer_);
        nft = new UnestNFT(address(this), collectionOwner_, renderer_, revealDelay);
        _mint(initialRecipient, INITIAL_SUPPLY);
    }

    receive() external payable {
        _depositFees(msg.value);
    }

    function depositFees() external payable {
        _depositFees(msg.value);
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        uint256 redirectedBefore = redirectedBuybackTotal;
        bool success = super.transfer(to, value);
        _tryRedirectedBuybackAfterTransfer(redirectedBefore, to);
        return success;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        uint256 redirectedBefore = redirectedBuybackTotal;
        bool success = super.transferFrom(from, to, value);
        _tryRedirectedBuybackAfterTransfer(redirectedBefore, to);
        return success;
    }

    function recordBuy(address buyer, uint256 amount) external returns (uint256 minted) {
        if (msg.sender != market) revert Unauthorized();
        return _mintPurchased(buyer, amount);
    }

    function recordSell(address seller, uint256 amount)
        external
        nonReentrant
        returns (uint256 burned)
    {
        if (msg.sender != market) revert Unauthorized();
        burned = _burnExcess(seller);
        emit MarketSell(seller, amount, burned);
        _tryBuyback();
    }

    function transferNftBacking(address from, address to) external {
        if (msg.sender != address(nft)) revert Unauthorized();
        backingTransfer = true;
        _transfer(from, to, UNIT);
        backingTransfer = false;
    }

    function payRevealFee(uint256 tokenId, address payer) external {
        if (msg.sender != address(nft)) revert Unauthorized();
        uint256 requiredBalance = nft.balanceOf(payer) * UNIT + REVEAL_FEE;
        if (balanceOf(payer) < requiredBalance) revert InsufficientRevealBalance();
        _burn(payer, REVEAL_FEE);
        emit RevealFeeBurned(tokenId, payer, REVEAL_FEE);
    }

    function onNftRevealed(uint256 tokenId, bytes32 seed) external {
        if (msg.sender != address(nft)) revert Unauthorized();
        _settleNft(tokenId);
        uint256 oldWeight = nftRewardWeight[tokenId];
        uint256 newWeight = renderer.rewardWeight(seed);
        totalRewardWeight = totalRewardWeight - oldWeight + newWeight;
        nftRewardWeight[tokenId] = newWeight;
        nftRewardDebt[tokenId] = newWeight * accRewardPerWeight;
        emit NftWeightUpdated(tokenId, oldWeight, newWeight);
    }

    function pendingReward(uint256 tokenId) public view returns (uint256) {
        uint256 scaled = nftRewardWeight[tokenId] * accRewardPerWeight;
        uint256 debt = nftRewardDebt[tokenId];
        uint256 delta = scaled >= debt ? scaled - debt : 0;
        return nftClaimable[tokenId] + (delta + nftRewardRemainder[tokenId]) / ACCURACY;
    }

    function pendingReward(address account) public view returns (uint256 amount) {
        uint256 count = nft.balanceOf(account);
        for (uint256 i; i < count; ++i) {
            amount += pendingReward(nft.tokenOfOwnerByIndex(account, i));
        }
    }

    function claim() external nonReentrant returns (uint256 amount) {
        uint256 count = nft.balanceOf(msg.sender);
        for (uint256 i; i < count; ++i) {
            amount += _claimNft(nft.tokenOfOwnerByIndex(msg.sender, i), msg.sender);
        }
        _payReward(msg.sender, amount);
        _tryOfficial();
        _tryBuyback();
    }

    function claim(uint256 tokenId) external nonReentrant returns (uint256 amount) {
        if (nft.ownerOf(tokenId) != msg.sender) revert Unauthorized();
        amount = _claimNft(tokenId, msg.sender);
        _payReward(msg.sender, amount);
        _tryOfficial();
        _tryBuyback();
    }

    function claimBatch(uint256[] calldata tokenIds)
        external
        nonReentrant
        returns (uint256 amount)
    {
        uint256 length = tokenIds.length;
        for (uint256 i; i < length; ++i) {
            uint256 tokenId = tokenIds[i];
            if (nft.ownerOf(tokenId) != msg.sender) revert Unauthorized();
            amount += _claimNft(tokenId, msg.sender);
        }
        _payReward(msg.sender, amount);
        _tryOfficial();
        _tryBuyback();
    }

    function executeOfficial() external nonReentrant returns (bool) {
        return _tryOfficial();
    }

    function executeBuyback() external nonReentrant returns (bool) {
        return _tryBuyback();
    }

    function performBuyback(uint256 amount) external returns (uint256 received) {
        if (msg.sender != address(this)) revert Unauthorized();
        uint256 beforeBalance = balanceOf(address(this));
        buybackExecutor.buy{ value: amount }(address(this), address(this));
        uint256 afterBalance = balanceOf(address(this));
        if (afterBalance <= beforeBalance) revert BuybackFailed();
        received = afterBalance - beforeBalance;
        _burn(address(this), received);
    }

    function burn(uint256 amount) external nonReentrant {
        uint256 redirectedBefore = redirectedBuybackTotal;
        _burn(msg.sender, amount);
        _tryRedirectedBuyback(redirectedBefore);
    }

    function _update(address from, address to, uint256 amount) internal override {
        super._update(from, to, amount);
        if (backingTransfer || from == address(0)) return;
        if (to == address(0)) {
            if (!_isSystem(from)) _burnExcess(from);
            return;
        }
        bool fromSystem = _isSystem(from);
        bool toSystem = _isSystem(to);
        if (fromSystem) {
            if (from == settlement && !toSystem) {
                uint256 purchased = IUnestSystemRegistry(market).consumeBuyCredit(amount);
                if (purchased != 0) _mintPurchased(to, purchased);
            }
            return;
        }
        if (toSystem) {
            _burnExcess(from);
            return;
        }
        _syncUserTransfer(from, to, amount);
    }

    function _syncUserTransfer(address from, address to, uint256 amount) internal {
        uint256 moveCount = amount / UNIT;
        uint256 owned = nft.balanceOf(from);
        if (moveCount > owned) moveCount = owned;
        uint256 capacity = balanceOf(to) / UNIT;
        uint256 receiverCount = nft.balanceOf(to);
        uint256 available = capacity > receiverCount ? capacity - receiverCount : 0;
        if (moveCount > available) moveCount = available;
        for (uint256 i; i < moveCount; ++i) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(from, nft.balanceOf(from) - 1);
            nft.controllerTransfer(from, to, tokenId);
            emit NftMoved(from, to, tokenId);
        }
        _burnExcess(from);
    }

    function _burnExcess(address account) internal returns (uint256 burned) {
        if (account == address(0) || _isSystem(account)) return 0;
        uint256 allowed = balanceOf(account) / UNIT;
        uint256 count = nft.balanceOf(account);
        while (count > allowed) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(account, count - 1);
            uint256 redirected = _removeNft(tokenId);
            nft.controllerBurn(tokenId);
            emit NftRewardRedirected(tokenId, redirected);
            emit NftBurned(account, tokenId);
            ++burned;
            --count;
        }
    }

    function _mintPurchased(address buyer, uint256 amount) internal returns (uint256 minted) {
        if (_isSystem(buyer)) return 0;
        uint256 current = nft.balanceOf(buyer);
        uint256 capacity = balanceOf(buyer) / UNIT;
        if (capacity <= current) return 0;
        minted = amount / UNIT;
        uint256 available = capacity - current;
        if (minted > available) minted = available;
        if (minted == 0) return 0;
        for (uint256 i; i < minted; ++i) {
            nft.mint(buyer);
        }
        emit MarketBuy(buyer, amount, minted);
    }

    function _settleNft(uint256 tokenId) internal {
        uint256 scaled = nftRewardWeight[tokenId] * accRewardPerWeight;
        uint256 debt = nftRewardDebt[tokenId];
        uint256 delta = scaled >= debt ? scaled - debt : 0;
        uint256 totalScaled = delta + nftRewardRemainder[tokenId];
        if (totalScaled != 0) {
            nftClaimable[tokenId] += totalScaled / ACCURACY;
            nftRewardRemainder[tokenId] = totalScaled % ACCURACY;
        }
        nftRewardDebt[tokenId] = scaled;
    }

    function _claimNft(uint256 tokenId, address account) internal returns (uint256 amount) {
        _settleNft(tokenId);
        amount = nftClaimable[tokenId];
        nftClaimable[tokenId] = 0;
        emit NftRewardClaimed(tokenId, account, amount);
    }

    function _removeNft(uint256 tokenId) internal returns (uint256 redirected) {
        _settleNft(tokenId);
        redirected = nftClaimable[tokenId];
        uint256 scaledRemainder = buybackRewardRemainder + nftRewardRemainder[tokenId];
        redirected += scaledRemainder / ACCURACY;
        buybackRewardRemainder = scaledRemainder % ACCURACY;
        totalRewardWeight -= nftRewardWeight[tokenId];
        if (totalRewardWeight == 0 && holderDistributionRemainder != 0) {
            redirected += holderDistributionRemainder;
            holderDistributionRemainder = 0;
        }
        delete nftRewardWeight[tokenId];
        delete nftRewardDebt[tokenId];
        delete nftRewardRemainder[tokenId];
        delete nftClaimable[tokenId];
        if (redirected != 0) {
            pendingBuyback += redirected;
            redirectedBuybackTotal += redirected;
        }
    }

    function _payReward(address account, uint256 amount) internal {
        if (amount == 0) return;
        (bool success,) = account.call{ value: amount }("");
        if (!success) revert TransferFailed();
        emit RewardClaimed(account, amount);
    }

    function _depositFees(uint256 amount) internal {
        if (amount == 0) return;
        uint256 holderAmount = amount * HOLDER_SHARE / 100;
        uint256 officialAmount = amount * OFFICIAL_SHARE / 100;
        uint256 buybackAmount = amount - holderAmount - officialAmount;
        if (totalRewardWeight == 0) {
            buybackAmount += holderAmount;
            holderAmount = 0;
        }
        pendingOfficial += officialAmount;
        pendingBuyback += buybackAmount;
        if (holderAmount != 0) _distributeHolderFees(holderAmount);
        emit FeesDeposited(amount, holderAmount, officialAmount, buybackAmount);
    }

    function _distributeHolderFees(uint256 amount) internal {
        uint256 weight = totalRewardWeight;
        if (weight == 0) return;
        uint256 totalAmount = amount + holderDistributionRemainder;
        uint256 increment = totalAmount * ACCURACY / weight;
        uint256 allocated = increment * weight / ACCURACY;
        holderDistributionRemainder = totalAmount - allocated;
        accRewardPerWeight += increment;
    }

    function _tryOfficial() internal returns (bool success) {
        uint256 amount = pendingOfficial;
        if (amount == 0) return true;
        pendingOfficial = 0;
        (success,) = official.call{ value: amount }("");
        if (success) {
            emit OfficialExecuted(amount);
        } else {
            pendingOfficial = amount;
            emit OfficialDeferred(amount);
        }
    }

    function _tryBuyback() internal returns (bool success) {
        uint256 amount = pendingBuyback;
        if (amount == 0) return true;
        pendingBuyback = 0;
        try this.performBuyback(amount) returns (uint256 received) {
            emit BuybackExecuted(amount, received);
            success = true;
        } catch {
            pendingBuyback = amount;
            emit BuybackDeferred(amount);
        }
    }

    function _tryRedirectedBuyback(uint256 redirectedBefore) internal {
        if (redirectedBuybackTotal != redirectedBefore) _tryBuyback();
    }

    function _tryRedirectedBuybackAfterTransfer(uint256 redirectedBefore, address to) internal {
        // Transfers into the PoolManager happen while its unlock callback is active.
        // Starting a nested buyback there must be deferred until Market.recordSell(),
        // which runs after the outer swap has completed and the manager is locked again.
        if (to != settlement) _tryRedirectedBuyback(redirectedBefore);
    }

    function _isSystem(address account) internal view returns (bool) {
        if (
            account == address(0) || account == address(this) || account == market
                || account == settlement || account == official
                || account == address(buybackExecutor)
        ) return true;
        try IUnestSystemRegistry(market).isSystem(account) returns (bool system) {
            return system;
        } catch {
            return false;
        }
    }
}
