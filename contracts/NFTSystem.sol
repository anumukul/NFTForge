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
    }

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
}
