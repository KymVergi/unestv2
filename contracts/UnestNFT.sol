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

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721Enumerable
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC4906 } from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IUnestController } from "@Unest/interfaces/IUnestController.sol";
import { IUnestRenderer } from "@Unest/interfaces/IUnestRenderer.sol";

/// @title UnestNFT
/// @notice ERC-721 egg collection with commit–reveal metadata via block hashes
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract UnestNFT is ERC721Enumerable, Ownable, IERC4906 {
    bytes4 private constant ERC4906_INTERFACE_ID = 0x49064906;

    error Unauthorized();
    error RevealNotReady();
    error AlreadyRevealed();

    event RevealRescheduled(
        uint256 indexed tokenId, uint256 previousTargetBlock, uint256 newTargetBlock
    );

    address public immutable controller;
    IUnestRenderer public immutable renderer;
    uint256 public immutable revealDelay;
    uint256 public nextTokenId = 1;

    mapping(uint256 => uint256) public revealBlock;
    mapping(uint256 => bytes32) public revealSeed;

    constructor(
        address controller_,
        address collectionOwner_,
        address renderer_,
        uint256 revealDelay_
    ) ERC721("UNEST", "UNEST") Ownable(collectionOwner_) {
        controller = controller_;
        renderer = IUnestRenderer(renderer_);
        revealDelay = revealDelay_;
    }

    modifier onlyController() {
        if (msg.sender != controller) revert Unauthorized();
        _;
    }

    function mint(address to) external onlyController returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        revealBlock[tokenId] = block.number + revealDelay;
        _mint(to, tokenId);
    }

    function controllerTransfer(address from, address to, uint256 tokenId) external onlyController {
        _transfer(from, to, tokenId);
    }

    function controllerBurn(uint256 tokenId) external onlyController {
        delete revealBlock[tokenId];
        delete revealSeed[tokenId];
        _burn(tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId)
        public
        override(ERC721, IERC721)
    {
        IUnestController(controller).transferNftBacking(from, to);
        super.transferFrom(from, to, tokenId);
    }

    function reveal(uint256 tokenId) external returns (bytes32 seed) {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != tokenOwner) revert Unauthorized();
        if (revealSeed[tokenId] != bytes32(0)) revert AlreadyRevealed();
        uint256 target = revealBlock[tokenId];
        if (block.number <= target) revert RevealNotReady();
        if (block.number - target > 256) {
            uint256 newTarget = block.number + 1;
            revealBlock[tokenId] = newTarget;
            emit RevealRescheduled(tokenId, target, newTarget);
            return bytes32(0);
        }
        bytes32 targetHash = blockhash(target);
        if (targetHash == bytes32(0)) revert RevealNotReady();
        seed = keccak256(abi.encodePacked(targetHash, tokenId, address(this)));
        IUnestController(controller).payRevealFee(tokenId, tokenOwner);
        revealSeed[tokenId] = seed;
        delete revealBlock[tokenId];
        IUnestController(controller).onNftRevealed(tokenId, seed);
        emit MetadataUpdate(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId);
        bytes32 seed = revealSeed[tokenId];
        return renderer.tokenURI(tokenId, seed, seed != bytes32(0));
    }

    function traits(uint256 tokenId)
        external
        view
        returns (
            string memory shell,
            string memory pattern,
            string memory crown,
            string memory speckle,
            string memory emblem,
            string memory backdrop
        )
    {
        ownerOf(tokenId);
        bytes32 seed = revealSeed[tokenId];
        if (seed == bytes32(0)) revert RevealNotReady();
        return renderer.traits(seed);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, IERC165)
        returns (bool)
    {
        return interfaceId == ERC4906_INTERFACE_ID || super.supportsInterface(interfaceId);
    }
}
