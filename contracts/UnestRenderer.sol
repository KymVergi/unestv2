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

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IUnestRenderer } from "@Unest/interfaces/IUnestRenderer.sol";

/// @title UnestRenderer
/// @notice Fully on-chain generative pixel-art chicks. Six traits from the reveal seed:
///         Shell, Pattern, Crown, Speckle, Emblem, Backdrop (weight base 100, cap 300).
/// @custom:website https://unest.fun/
/// @custom:twitter https://x.com/unest_fun
contract UnestRenderer is IUnestRenderer {
    using Strings for uint256;

    // Chick body (pixel grid 64x64), generated as stacked 2px rows.
    string private constant CHICK =
        "M28 18H36V20H28ZM26 20H38V22H26ZM24 22H40V24H24ZM22 24H42V26H22ZM20 26H44V38H20ZM20 38H44V40H20ZM22 40H42V42H22ZM24 42H40V44H24ZM26 44H38V46H26Z";
    string private constant CHICK_ARMS = "M18 30H20V34H18ZM44 30H46V34H44";
    string private constant CHICK_FEET = "M26 46H28V48H26ZM34 46H36V48H34";

    function tokenURI(uint256 tokenId, bytes32 seed, bool revealed)
        external
        pure
        returns (string memory)
    {
        if (!revealed) return _hiddenUri(tokenId);
        uint8[6] memory ids = _indices(seed);
        string memory image = _image(ids);
        string memory json = string.concat(
            '{"name":"UNEST Egg #',
            tokenId.toString(),
            '","description":"UNEST on-chain chick","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(image)),
            '","attributes":[{"trait_type":"Shell","value":"',
            _shellName(ids[0]),
            '"},{"trait_type":"Pattern","value":"',
            _patternName(ids[1]),
            '"},{"trait_type":"Crown","value":"',
            _crownName(ids[2]),
            '"},{"trait_type":"Speckle","value":"',
            _speckleName(ids[3]),
            '"},{"trait_type":"Emblem","value":"',
            _emblemName(ids[4]),
            '"},{"trait_type":"Backdrop","value":"',
            _backdropName(ids[5]),
            '"}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function traits(bytes32 seed)
        external
        pure
        returns (
            string memory shell,
            string memory pattern,
            string memory crown,
            string memory speckle,
            string memory emblem,
            string memory backdrop
        )
    {
        uint8[6] memory ids = _indices(seed);
        return (
            _shellName(ids[0]),
            _patternName(ids[1]),
            _crownName(ids[2]),
            _speckleName(ids[3]),
            _emblemName(ids[4]),
            _backdropName(ids[5])
        );
    }

    function traitIndices(bytes32 seed) external pure returns (uint8[6] memory) {
        return _indices(seed);
    }

    function rewardWeight(bytes32 seed) external pure returns (uint256 weight) {
        uint8[6] memory ids = _indices(seed);
        weight = 100;
        for (uint8 i; i < 6; ++i) {
            weight += _rarityBonus(ids[i], i);
        }
        if (weight > 300) weight = 300;
    }

    // ---------------------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------------------

    function _hiddenUri(uint256 tokenId) private pure returns (string memory) {
        string memory image = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>",
            "<rect width='64' height='64' fill='#1a1d18'/>",
            "<path d='",
            CHICK,
            "' fill='#2a2035'/><path d='",
            CHICK_ARMS,
            "' fill='#2a2035'/><path d='",
            CHICK_FEET,
            "' fill='#111'/>",
            "<rect x='27' y='28' width='2' height='2' fill='#4a6741'/><rect x='33' y='28' width='2' height='2' fill='#4a6741'/>",
            "<path d='M30 32H34V34H32V36H30Z' fill='#3d3020'/></svg>"
        );
        string memory json = string.concat(
            '{"name":"UNEST Egg #',
            tokenId.toString(),
            '","description":"Sealed UNEST egg","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(image)),
            '","attributes":[{"trait_type":"Status","value":"Unrevealed"}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _image(uint8[6] memory ids) private pure returns (string memory) {
        (string memory fill, string memory accent, string memory shadow) = _palette(ids[0]);
        return string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>",
            "<rect width='64' height='64' fill='",
            _backdropColor(ids[5]),
            "'/><path d='",
            CHICK,
            "' transform='translate(1 1)' fill='#111'/><path d='",
            CHICK,
            "' fill='",
            fill,
            "'/><defs><clipPath id='c'><path d='",
            CHICK,
            "'/></clipPath></defs><g clip-path='url(#c)'>",
            _patternSvg(ids[1], accent, shadow),
            _speckleSvg(ids[3], accent, shadow),
            "<path d='M38 26H42V44H40V28H38Z' fill='",
            shadow,
            "'/>",
            _chestEmblemSvg(ids[4], ids[0]),
            "</g><path d='",
            CHICK_ARMS,
            "' fill='",
            fill,
            "'/><path d='",
            CHICK_FEET,
            "' fill='",
            shadow,
            "'/>",
            _faceSvg(ids[4]),
            "<g transform='translate(0 10)'>",
            _crownSvg(ids[2], fill, accent, shadow),
            "</g></svg>"
        );
    }

    function _faceSvg(uint8 emblemId) private pure returns (string memory) {
        string memory eyes =
            "<rect x='27' y='28' width='2' height='2' fill='#111'/><rect x='33' y='28' width='2' height='2' fill='#111'/>";
        if (emblemId == 5) {
            eyes = "<path d='M27 29H29M33 29H35' stroke='#111' stroke-width='1'/>";
        } else if (emblemId == 6) {
            eyes =
                "<rect x='28' y='28' width='8' height='4' fill='#fff'/><rect x='30' y='29' width='4' height='2' fill='#111'/>";
        } else if (emblemId == 7) {
            eyes =
                "<rect x='27' y='28' width='2' height='2' fill='#f33'/><rect x='33' y='28' width='2' height='2' fill='#f33'/>";
        } else if (emblemId == 11) {
            eyes =
                "<rect x='27' y='28' width='2' height='2' fill='#fe4'/><rect x='33' y='28' width='2' height='2' fill='#fe4'/>";
        }
        return string.concat(eyes, "<path d='M30 32H34V34H32V36H30Z' fill='#f93'/>");
    }

    function _chestEmblemSvg(uint8 id, uint8 shellId) private pure returns (string memory) {
        if (id == 0 || id == 5 || id == 6 || id == 7 || id == 11) return "";
        return _emblemSvg(id, shellId);
    }

    function _patternSvg(uint8 id, string memory accent, string memory shadow)
        private
        pure
        returns (string memory)
    {
        if (id == 0) return ""; // Plain
        if (id == 1) { // Stripes
            return string.concat(
                "<path d='M18 28H46V30H18ZM18 34H46V36H18ZM18 40H46V42H18Z' fill='", accent, "'/>"
            );
        }
        if (id == 2) { // Bands
            return string.concat(
                "<path d='M18 26H46V28H18ZM18 32H46V34H18ZM18 38H46V40H18Z' fill='", shadow, "'/>"
            );
        }
        if (id == 3) { // Dots
            return string.concat(
                "<path d='M22 26H24V28H22ZM32 26H34V28H32ZM26 32H28V34H26ZM36 32H38V34H36ZM22 38H24V40H22ZM34 38H36V40H34Z' fill='",
                accent, "'/>"
            );
        }
        if (id == 4) { // Zigzag
            return string.concat(
                "<path d='M18 30L24 26L30 30L36 26L42 30' fill='none' stroke='",
                accent, "' stroke-width='2'/><path d='M18 38L24 34L30 38L36 34L42 38' fill='none' stroke='",
                accent, "' stroke-width='2'/>"
            );
        }
        if (id == 5) { // Diamonds
            return string.concat(
                "<path d='M26 26L28 28L26 30L24 28ZM36 32L38 34L36 36L34 34ZM26 38L28 40L26 42L24 40Z' fill='",
                accent, "'/>"
            );
        }
        if (id == 6) { // Splatter
            return string.concat(
                "<path d='M20 28H22V30H20ZM38 26H40V28H38ZM24 34H26V36H24ZM36 38H38V40H36ZM28 30H29V31H28ZM40 36H41V37H40ZM22 40H24V42H22Z' fill='",
                shadow, "'/>"
            );
        }
        if (id == 7) { // Marble
            return string.concat(
                "<path d='M18 26C24 30 26 24 32 28C38 32 40 26 46 30M18 36C24 40 28 34 34 38C40 42 42 36 46 40' fill='none' stroke='",
                shadow, "' stroke-width='2'/>"
            );
        }
        if (id == 8) { // Hearts
            return string.concat(
                "<path d='M24 28H26V26H28V28H29V30H28V31H26V32H24V31H23V29H24ZM36 34H38V32H39V34H40V35H39V36H38V37H36V36H35V35H36Z' fill='",
                accent, "'/>"
            );
        }
        if (id == 9) { // Circuit
            return string.concat(
                "<path d='M20 28H28V34H34V28M24 38H30V34H38V38' fill='none' stroke='",
                accent, "' stroke-width='2'/><path d='M18 26H20V28H18ZM38 36H40V38H38Z' fill='",
                accent, "'/>"
            );
        }
        if (id == 10) { // Glitch
            return "<path d='M18 28H34V30H18Z' fill='#23e8ff'/><path d='M24 34H42V36H24Z' fill='#ff4fd8'/><path d='M20 40H36V42H20Z' fill='#23e8ff'/>";
        }
        // Galaxy
        return string.concat(
            "<path d='M20 26H22V28H20ZM30 26H32V28H30ZM38 28H40V30H38ZM24 32H26V34H24ZM34 34H36V36H34ZM22 40H24V42H22ZM32 40H34V42H32ZM40 38H42V40H40Z' fill='#ffffff'/><path d='M28 32H30V34H28Z' fill='",
            accent, "'/>"
        );
    }

    function _speckleSvg(uint8 id, string memory accent, string memory shadow)
        private
        pure
        returns (string memory)
    {
        if (id == 0) return ""; // None
        if (id == 11) { // Prismatic
            return "<path d='M22 30H23V31H22ZM30 28H31V29H30ZM38 34H39V35H38ZM26 38H27V39H26ZM36 40H37V41H36Z' fill='#63e3ff'/><path d='M24 32H25V33H24ZM34 30H35V31H34ZM30 40H31V41H30Z' fill='#ff5fd0'/>";
        }
        string memory c = id % 2 == 0 ? shadow : accent;
        return string.concat(
            "<path d='M22 30H23V31H22ZM30 28H31V29H30ZM38 34H39V35H38ZM26 36H27V37H26ZM34 40H35V41H34ZM20 36H21V37H20ZM42 30H43V31H42Z' fill='",
            c, "'/>"
        );
    }

    function _crownSvg(uint8 id, string memory fill, string memory accent, string memory shadow)
        private
        pure
        returns (string memory)
    {
        if (id == 0) return ""; // None
        if (id == 1) { // Leaf
            return "<path d='M31 6C24 8 22 14 28 16C34 16 34 10 31 6Z' fill='#4fbf6a' stroke='#241027' stroke-width='1'/><path d='M31 10V16' stroke='#241027' stroke-width='1'/>";
        }
        if (id == 2) { // Bow
            return string.concat(
                "<path d='M24 8L30 12L24 16ZM40 8L34 12L40 16Z' fill='", accent,
                "' stroke='#241027' stroke-width='1'/><rect x='30' y='10' width='4' height='4' fill='", shadow, "'/>"
            );
        }
        if (id == 3) { // Halo
            return "<ellipse cx='32' cy='8' rx='9' ry='3' fill='none' stroke='#ffe14a' stroke-width='2'/>";
        }
        if (id == 4) { // Sprout
            return "<path d='M31 4V14' stroke='#4fbf6a' stroke-width='2'/><path d='M31 8C26 6 24 10 28 12C31 12 32 10 31 8ZM32 6C37 4 39 8 35 10C32 10 31 8 32 6Z' fill='#5fd47a' stroke='#241027' stroke-width='1'/>";
        }
        if (id == 5) { // Flame
            return "<path d='M32 2C29 7 26 8 28 12C29 15 35 15 36 12C38 8 34 8 32 2Z' fill='#ff6a32' stroke='#241027' stroke-width='1'/><path d='M32 7C31 10 30 10 31 12C32 13 34 12 33 10Z' fill='#fff05c'/>";
        }
        if (id == 6) { // Party Hat
            return string.concat(
                "<path d='M32 2L26 14H38Z' fill='", accent,
                "' stroke='#241027' stroke-width='1'/><circle cx='32' cy='3' r='2' fill='#fff05c'/><path d='M29 10H35' stroke='#fff' stroke-width='1'/>"
            );
        }
        if (id == 7) { // Antenna
            return "<path d='M28 4V14M36 4V14' stroke='#241027' stroke-width='1'/><circle cx='28' cy='4' r='2' fill='#ff4f9a'/><circle cx='36' cy='4' r='2' fill='#63e3ff'/>";
        }
        if (id == 8) { // Crack
            return "<path d='M22 12L28 8L32 12L38 8L44 12' fill='none' stroke='#fff' stroke-width='2'/>";
        }
        if (id == 9) { // Feather
            return string.concat(
                "<path d='M33 2C27 8 27 14 31 16C31 12 35 8 33 2Z' fill='", fill,
                "' stroke='#241027' stroke-width='1'/><path d='M31 6L34 4M30 9L34 7M30 12L33 11' stroke='#241027' stroke-width='1'/>"
            );
        }
        if (id == 10) { // Snow Cap
            return "<path d='M24 12C24 6 40 6 40 12C40 16 24 16 24 12Z' fill='#eaf6ff' stroke='#241027' stroke-width='1'/><path d='M26 12H38' stroke='#bcd8ea' stroke-width='1'/>";
        }
        // Gold Halo (legendary)
        return "<ellipse cx='32' cy='7' rx='10' ry='3' fill='none' stroke='#ffd23f' stroke-width='3'/><path d='M24 7H40' stroke='#fff3b0' stroke-width='1'/>";
    }

    function _emblemSvg(uint8 id, uint8 shellId) private pure returns (string memory) {
        if (id == 0) return ""; // None
        string memory gold = shellId == 10 ? "#fff8dc" : "#ffd23f";
        if (id == 1) { // Heart
            return "<path d='M30 36H31V35H33V36H34V38H33V39H31V40H30V39H28V38H27V36H28V35H30Z' fill='#ff4f8b' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 2) { // Star
            return "<path d='M31 34L32 36H34L32 37L33 39L31 38L29 39L30 37L28 36H30Z' fill='#fff' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 3) { // Lightning
            return "<path d='M32 34H35L33 37H35L30 42L31 38H29Z' fill='#ffe14a' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 4) { // Flame
            return "<path d='M31 34C32 36 34 36 34 38C34 40 33 41 31 41C29 41 28 40 28 38C28 36 30 36 30 35L32 37Z' fill='#ff6a32' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 5) { // Moon — rendered as face variant
            return "";
        }
        if (id == 6) { // Eye — rendered as face variant
            return "";
        }
        if (id == 7) { // Chick — rendered as face variant
            return "";
        }
        if (id == 8) { // Diamond
            return "<path d='M31 34L34 36L31 40L28 36Z' fill='#83ebff' stroke='#1a1020' stroke-width='1'/><path d='M31 34L29 36L31 40L33 36Z' fill='#fff'/><path d='M28 36H34' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 9) { // Planet
            return "<circle cx='31' cy='37' r='3' fill='#83ebff' stroke='#1a1020' stroke-width='1'/><path d='M27 38L29 37L33 36L35 37L33 38L29 39Z' fill='#ffd23f' stroke='#1a1020' stroke-width='1'/>";
        }
        if (id == 10) { // Crown
            return string.concat(
                "<path d='M28 35L29 37L31 34L33 37L34 35L33 40H29Z' fill='", gold,
                "' stroke='#1a1020' stroke-width='1'/><rect x='30' y='37' width='1' height='1' fill='#ff4f9a'/><rect x='32' y='37' width='1' height='1' fill='#63e3ff'/>"
            );
        }
        // Phoenix (legendary)
        return "<path d='M30 40V36H31V34H32V32L33 34L34 33V35H35V36H31M31 36L29 35H28L30 36M30 38L28 37H27L30 38' fill='#ff8a2a' stroke='#1a1020' stroke-width='1'/><rect x='33' y='34' width='1' height='1' fill='#1a1020'/>";
    }

    // ---------------------------------------------------------------------
    // Trait selection & rarity (identical distribution to the original system)
    // ---------------------------------------------------------------------

    function _indices(bytes32 seed) private pure returns (uint8[6] memory ids) {
        for (uint8 i; i < 6; ++i) {
            ids[i] = _pick(uint8(uint256(keccak256(abi.encodePacked(seed, i))) % 100), i);
        }
    }

    function _pick(uint8 roll, uint8 trait) private pure returns (uint8) {
        if (trait == 0) {
            if (roll < 16) return 0;
            if (roll < 30) return 1;
            if (roll < 44) return 2;
            if (roll < 56) return 3;
            if (roll < 67) return 4;
            if (roll < 77) return 5;
            if (roll < 85) return 6;
            if (roll < 91) return 7;
            if (roll < 95) return 8;
            if (roll < 97) return 9;
            if (roll < 99) return 10;
            return 11;
        }
        if (trait == 1) {
            if (roll < 18) return 0;
            if (roll < 33) return 1;
            if (roll < 46) return 2;
            if (roll < 58) return 3;
            if (roll < 68) return 4;
            if (roll < 77) return 5;
            if (roll < 84) return 6;
            if (roll < 90) return 7;
            if (roll < 94) return 8;
            if (roll < 97) return 9;
            if (roll < 99) return 10;
            return 11;
        }
        if (trait == 2) {
            if (roll < 21) return 0;
            if (roll < 37) return 1;
            if (roll < 50) return 2;
            if (roll < 61) return 3;
            if (roll < 70) return 4;
            if (roll < 78) return 5;
            if (roll < 85) return 6;
            if (roll < 90) return 7;
            if (roll < 94) return 8;
            if (roll < 97) return 9;
            if (roll < 99) return 10;
            return 11;
        }
        if (trait == 3) {
            if (roll < 18) return 0;
            if (roll < 33) return 1;
            if (roll < 47) return 2;
            if (roll < 59) return 3;
            if (roll < 69) return 4;
            if (roll < 78) return 5;
            if (roll < 85) return 6;
            if (roll < 91) return 7;
            if (roll < 95) return 8;
            if (roll < 97) return 9;
            if (roll < 99) return 10;
            return 11;
        }
        if (trait == 4) {
            if (roll < 14) return 0;
            if (roll < 30) return 1;
            if (roll < 43) return 2;
            if (roll < 54) return 3;
            if (roll < 65) return 4;
            if (roll < 74) return 5;
            if (roll < 82) return 6;
            if (roll < 88) return 7;
            if (roll < 93) return 8;
            if (roll < 97) return 9;
            if (roll < 99) return 10;
            return 11;
        }
        if (roll < 20) return 0;
        if (roll < 36) return 1;
        if (roll < 50) return 2;
        if (roll < 61) return 3;
        if (roll < 71) return 4;
        if (roll < 79) return 5;
        if (roll < 86) return 6;
        if (roll < 91) return 7;
        if (roll < 95) return 8;
        if (roll < 97) return 9;
        if (roll < 99) return 10;
        return 11;
    }

    function _rarityBonus(uint8 id, uint8 trait) private pure returns (uint256) {
        if (id == 11) return 75;
        uint8 legendaryStart = trait == 0 || trait == 3 || trait == 5 ? 9 : 10;
        if (id >= legendaryStart) return 35;
        if (id >= 7) return 15;
        uint8 uncommonStart = trait < 2 ? 4 : trait == 2 || trait == 4 || trait == 5 ? 3 : 4;
        if (id >= uncommonStart) return 5;
        return 0;
    }

    // ---------------------------------------------------------------------
    // Palettes & names
    // ---------------------------------------------------------------------

    function _palette(uint8 id)
        private
        pure
        returns (string memory fill, string memory accent, string memory shadow)
    {
        if (id == 0) return ("#f5f0dc", "#fff8e7", "#c9b896"); // Cream
        if (id == 1) return ("#9b59b6", "#bb86fc", "#6a3d8f"); // Purple
        if (id == 2) return ("#5dade2", "#85c1e9", "#2e86ab"); // Sky
        if (id == 3) return ("#58d68d", "#82e0aa", "#239b56"); // Green
        if (id == 4) return ("#f4d03f", "#f9e79f", "#d4ac0d"); // Butter
        if (id == 5) return ("#95a5a6", "#bdc3c7", "#566573"); // Grey
        if (id == 6) return ("#e74c3c", "#f1948a", "#922b21"); // Red
        if (id == 7) return ("#e67e22", "#f5b041", "#ba4a00"); // Orange
        if (id == 8) return ("#48c9b0", "#76d7c4", "#1e8449"); // Aqua
        if (id == 9) return ("#ecf0f1", "#ffffff", "#95a5a6"); // White
        if (id == 10) return ("#f2b705", "#ffe58a", "#b7780b"); // Gold
        return ("#8e46ff", "#bb86fc", "#4a148c"); // Cosmic
    }

    function _backdropColor(uint8 id) private pure returns (string memory) {
        if (id == 0) return "#1c1f1a";
        if (id == 1) return "#1a181f";
        if (id == 2) return "#181c1f";
        if (id == 3) return "#181f1a";
        if (id == 4) return "#1f1c18";
        if (id == 5) return "#1a1a1a";
        if (id == 6) return "#1f1818";
        if (id == 7) return "#1f1a18";
        if (id == 8) return "#181f1c";
        if (id == 9) return "#222222";
        if (id == 10) return "#1f1a10";
        return "#140a24";
    }

    function _shellName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "Cream";
        if (id == 1) return "Purple";
        if (id == 2) return "Sky";
        if (id == 3) return "Green";
        if (id == 4) return "Butter";
        if (id == 5) return "Grey";
        if (id == 6) return "Red";
        if (id == 7) return "Orange";
        if (id == 8) return "Aqua";
        if (id == 9) return "White";
        if (id == 10) return "Gold";
        return "Cosmic";
    }

    function _patternName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "Plain";
        if (id == 1) return "Stripes";
        if (id == 2) return "Bands";
        if (id == 3) return "Dots";
        if (id == 4) return "Zigzag";
        if (id == 5) return "Diamonds";
        if (id == 6) return "Splatter";
        if (id == 7) return "Marble";
        if (id == 8) return "Hearts";
        if (id == 9) return "Circuit";
        if (id == 10) return "Glitch";
        return "Galaxy";
    }

    function _crownName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "None";
        if (id == 1) return "Leaf";
        if (id == 2) return "Bow";
        if (id == 3) return "Halo";
        if (id == 4) return "Sprout";
        if (id == 5) return "Flame";
        if (id == 6) return "Party Hat";
        if (id == 7) return "Antenna";
        if (id == 8) return "Crack";
        if (id == 9) return "Feather";
        if (id == 10) return "Snow Cap";
        return "Gold Halo";
    }

    function _speckleName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "Smooth";
        if (id == 1) return "Freckled";
        if (id == 2) return "Dotted";
        if (id == 3) return "Speckled";
        if (id == 4) return "Flecked";
        if (id == 5) return "Dusted";
        if (id == 6) return "Peppered";
        if (id == 7) return "Mottled";
        if (id == 8) return "Stippled";
        if (id == 9) return "Scattered";
        if (id == 10) return "Starred";
        return "Prismatic";
    }

    function _emblemName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "None";
        if (id == 1) return "Heart";
        if (id == 2) return "Star";
        if (id == 3) return "Lightning";
        if (id == 4) return "Flame";
        if (id == 5) return "Moon";
        if (id == 6) return "Eye";
        if (id == 7) return "Chick";
        if (id == 8) return "Diamond";
        if (id == 9) return "Planet";
        if (id == 10) return "Crown";
        return "Phoenix";
    }

    function _backdropName(uint8 id) private pure returns (string memory) {
        if (id == 0) return "Forest";
        if (id == 1) return "Dusk";
        if (id == 2) return "Night";
        if (id == 3) return "Moss";
        if (id == 4) return "Amber";
        if (id == 5) return "Charcoal";
        if (id == 6) return "Ember";
        if (id == 7) return "Copper";
        if (id == 8) return "Deep Sea";
        if (id == 9) return "Slate";
        if (id == 10) return "Gold";
        return "Void";
    }
}
