// SPDX-License-Identifier:MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NFTContract is
    ERC721,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using Counters for Counters.Counter;

    Counters.Counter private tokenIds;

    uint256 public constant maxSupply = 1000;
    uint256 public currentSupply = 0;

    string public baseURI;
    string public contractURI;
    bool public revealed = false;
    string public hiddenMetaDataURI;

    struct RarityTier {
        string name;
        uint256 probability;
        uint256 maxSupply;
        uint256 currentSupply;
        string specialAttribute;
    }

    RarityTier[] public rarityTiers;

    mapping(uint256 => uint256) public tokenToRarity;
    mapping(string => uint256) public rarityNameToIndex;

    uint256 private randomSeed;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        string memory _contractURI,
        string memory _hiddenMetaDataURI
    ) ERC721(_name, _symbol) {
        baseURI = _baseURI;
        contractURI = _contractURI;
        hiddenMetaDataURI = _hiddenMetaDataURI;

        tokenIds.increment();

        _initializeRarityTiers();

        randomSeed = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.difficulty, msg.sender)
            )
        );
    }

    function _initializeRarityTiers() private {
        rarityTiers.push(
            RarityTier({
                name: "Common",
                probability: 6000,
                maxSupply: 600,
                currentSupply: 0,
                specialAttribute: "Standard"
            })
        );

        rarityNameToIndex["Common"] = 0;

        rarityTiers.push(
            RarityTier({
                name: "Rare",
                probability: 2500,
                maxSupply: 250,
                currentSupply: 0,
                specialAttribute: "Enhanced"
            })
        );

        rarityNameToIndex["Rare"] = 1;

        rarityTiers.push(
            RarityTier({
                name: "Epic",
                probability: 1200,
                maxSupply: 120,
                currentSupply: 0,
                specialAttribute: "Legendary"
            })
        );

        rarityNameToIndex["Epic"] = 2;

        rarityTiers.push(
            RarityTier({
                name: "Legendary",
                probability: 300,
                maxSupply: 30,
                currentSupply: 0,
                specialAttribute: "Mythical"
            })
        );
        rarityNameToIndex["Legendary"] = 3;
    }

    function getRarityTier(
        uint256 index
    ) external view returns (RarityTier memory) {
        require(index < rarityTiers.length, "Invalid index");

        return rarityTiers[index];
    }

    function getRarityTierCount() external view returns (uint256) {
        return rarityTiers.length;
    }

    function getTokenRarity(
        uint256 tokenId
    ) external view returns (RarityTier memory) {
        require(_exists(tokenId), "Token does not exist");

        uint256 rarityIndex = tokenToRarity[tokenId];
        return rarityTiers[rarityIndex];
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
