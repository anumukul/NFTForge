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
    string public _contractURI;
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
        string memory contractURI_,
        string memory _hiddenMetaDataURI
    ) ERC721(_name, _symbol) {
        baseURI = _baseURI;
        _contractURI = contractURI_;
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

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    event TokenMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 rarityTier,
        string rarityName
    );

    event BatchMinted(
        address indexed to,
        uint256 quantity,
        uint256 startTokenId
    );

    event BaseURIUpdated(string newBaseURI);

    event ContractURIUpdated(string newContractURI);

    event HiddenMetaDataURIUpdated(string newHiddenMetaDataURI);
    event TokensRevealed();

    event TokenMetaDataUpdated(uint256 indexed tokenId, string newURI);

    function _generateRandomRarity() private returns (uint256) {
        randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    randomSeed,
                    block.timestamp,
                    block.difficulty,
                    msg.sender,
                    tokenIds.current()
                )
            )
        );

        uint256 randomNumber = randomSeed % 10000;

        uint256 cumulativeProbability = 0;

        for (uint256 i = 0; i < rarityTiers.length; i++) {
            cumulativeProbability += rarityTiers[i].probability;

            if (randomNumber < cumulativeProbability) {
                if (rarityTiers[i].currentSupply < rarityTiers[i].maxSupply) {
                    return i;
                }
            }
        }

        for (uint256 i = 0; i < rarityTiers.length; i++) {
            if (rarityTiers[i].currentSupply < rarityTiers[i].maxSupply) {
                return i;
            }
        }

        revert("No rarity tiers available");
    }

    function mint(address to) external whenNotPaused nonReentrant {
        require(currentSupply < maxSupply, "Maximum Supply reached");
        require(to != address(0), "Cannot mint to zero address");

        uint256 selectedRarityTier = _generateRandomRarity();

        require(
            rarityTiers[selectedRarityTier].currentSupply <
                rarityTiers[selectedRarityTier].maxSupply,
            "Selected rarity tier supply exhausted"
        );

        uint256 tokenId = tokenIds.current();
        _safeMint(to, tokenId);
        tokenIds.increment();

        currentSupply++;
        tokenToRarity[tokenId] = selectedRarityTier;
        rarityTiers[selectedRarityTier].currentSupply++;

        _setTokenURI(tokenId, _constructTokenURI(tokenId));

        emit TokenMinted(
            to,
            tokenId,
            selectedRarityTier,
            rarityTiers[selectedRarityTier].name
        );
    }

    function _constructTokenURI(
        uint256 tokenId
    ) private view returns (string memory) {
        if (!revealed) {
            return hiddenMetaDataURI;
        }

        return string(abi.encodePacked(baseURI, _toString(tokenId), ".json"));
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp = temp / 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    function ownerMint(address to, uint256 rarityTierIndex) external onlyOwner {
        require(currentSupply < maxSupply, "Maximum supply reached");

        require(to != address(0), "cannot mint to zero address");

        require(rarityTierIndex < rarityTiers.length, "Invalid rarity tier");

        require(
            rarityTiers[rarityTierIndex].currentSupply <
                rarityTiers[rarityTierIndex].maxSupply,
            "Rarity tier supply exhausted"
        );

        uint256 tokenId = tokenIds.current();
        _safeMint(to, tokenId);

        tokenIds.increment();
        currentSupply++;

        tokenToRarity[tokenId] = rarityTierIndex;
        rarityTiers[rarityTierIndex].currentSupply++;

        _setTokenURI(tokenId, _constructTokenURI(tokenId));
        emit TokenMinted(
            to,
            tokenId,
            rarityTierIndex,
            rarityTiers[rarityTierIndex].name
        );
    }

    function getRemainingRaritySupply(
        uint256 rarityTierIndex
    ) external view returns (uint256) {
        require(
            rarityTierIndex < rarityTiers.length,
            "Rarity tier does not exist"
        );
        return
            rarityTiers[rarityTierIndex].maxSupply -
            rarityTiers[rarityTierIndex].currentSupply;
    }

    function getRemainingSupply() external view returns (uint256) {
        return maxSupply - currentSupply;
    }

    function isRarityTierAvailable(
        uint256 rarityTierIndex
    ) external view returns (bool) {
        require(
            rarityTierIndex < rarityTiers.length,
            "Invalid rarity tier index"
        );
        return
            rarityTiers[rarityTierIndex].currentSupply <
            rarityTiers[rarityTierIndex].maxSupply;
    }

    function batchMint(
        address to,
        uint256 quantity
    ) external whenNotPaused nonReentrant {
        require(quantity > 0 && quantity <= 10, "Not a valid quantity");
        require(
            currentSupply + quantity <= maxSupply,
            "Batch mint exceeds max supply"
        );

        require(to != address(0), "Cannot mint to zero Address");
        uint256 startTokenId = tokenIds.current();

        for (uint256 i = 0; i < quantity; i++) {
            uint256 selectedRarityTier = _generateRandomRarity();
            uint256 tokenId = tokenIds.current();
            _safeMint(to, tokenId);

            tokenIds.increment();
            currentSupply++;

            tokenToRarity[tokenId] = selectedRarityTier;
            rarityTiers[selectedRarityTier].currentSupply++;

            _setTokenURI(tokenId, _constructTokenURI(tokenId));

            emit TokenMinted(
                to,
                tokenId,
                selectedRarityTier,
                rarityTiers[selectedRarityTier].name
            );
        }

        emit BatchMinted(to, quantity, startTokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "URI query for non existing token");

        if (!revealed) {
            return hiddenMetaDataURI;
        }

        string memory _tokenURI = super.tokenURI(tokenId);

        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        return string(abi.encodePacked(baseURI, _toString(tokenId), ".json"));
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;

        emit BaseURIUpdated(newBaseURI);
    }

    function setContractURI(string calldata newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    function setHiddenMetaDataURI(
        string calldata newHiddenMetaDataURI
    ) external onlyOwner {
        hiddenMetaDataURI = newHiddenMetaDataURI;
        emit HiddenMetaDataURIUpdated(newHiddenMetaDataURI);
    }

    function reveal() external onlyOwner {
        require(!revealed, "Tokens already revealed");

        revealed = true;
        emit TokensRevealed();
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function updateTokenMetadata(
        uint256 tokenId,
        string calldata newURI
    ) external onlyOwner {
        require(_exists(tokenId), "Invalid tokenId");
        require(revealed, "Token not revealed yet");
        _setTokenURI(tokenId, newURI);

        emit TokenMetaDataUpdated(tokenId, newURI);
    }

    function migrateToIPFS(string calldata newIPFSBaseURI) external onlyOwner {
        require(revealed, "Cannot migrate before reveal");
        baseURI = newIPFSBaseURI;
        emit BaseURIUpdated(newIPFSBaseURI);
    }
}
