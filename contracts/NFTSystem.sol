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

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMinted;
    uint256 public maxWhitelistMints = 3;
    bool public whitelistPhaseActive = false;

    uint256 public auctionStartPrice = 1 ether;
    uint256 public auctionEndPrice = 0.1 ether;
    uint256 public auctionStartTime;
    uint256 public auctionDuration = 3600;
    uint256 public auctionPriceDropInterval = 300;
    bool public auctionActive = false;

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

    event WhitelistUpdated(address indexed user, bool status);
    event WhitelistPhaseToggled(bool active);
    event WhitelistMinted(address indexed to, uint256 quantity);

    event AuctionStarted(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 startTime
    );

    event AuctionEnded();
    event AuctionPriceUpdated(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    );
    event AuctionMinted(
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        uint256 pricePerToken
    );

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

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            require(
                addresses[i] != address(0),
                "Cannot whitelist zero address"
            );
            whitelist[addresses[i]] = true;
            emit WhitelistUpdated(addresses[i], true);
        }
    }

    function removeFromWhitelist(
        address[] calldata addresses
    ) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = false;

            emit WhitelistUpdated(addresses[i], false);
        }
    }

    function setWhitelistPhase(bool active) external onlyOwner {
        whitelistPhaseActive = active;
        emit WhitelistPhaseToggled(active);
    }

    function setMaxWhitelistMints(uint256 maxMints) external onlyOwner {
        require(maxMints > 0, "Max mints must be greater than 0");
        maxWhitelistMints = maxMints;
    }

    function whitelistMint(
        uint256 quantity
    ) external whenNotPaused nonReentrant {
        require(whitelistPhaseActive, "Whitelist phase not active");
        require(whitelist[msg.sender], "Address not whitelisted");
        require(quantity > 0, "Quanitity must be greater than 0");
        require(
            whitelistMinted[msg.sender] + quantity <= maxWhitelistMints,
            "Exceed whitelist mint limit"
        );
        require(currentSupply + quantity <= maxSupply, "Exceeds max supply");

        uint256 startTokenId = tokenIds.current();

        for (uint256 i = 0; i < quantity; i++) {
            uint256 selectedRarityTier = _generateRandomRarity();
            uint526 tokenId = tokenIds.current();

            _safeMint(msg.sender, tokenId);
            tokenIds.increment();
            currentSupply++;

            tokenToRarity[tokenId] = selectedRarityTier;
            rarityTiers[selectedRarityTier].currentSupply++;

            _setTokenURI(tokenId, _constructTokenURI(tokenId));

            emit TokenMinted(
                msg.sender,
                tokenId,
                selectedRarityTier,
                rarityTiers[selectedRarityTier].name
            );
        }

        whitelistMinted[msg.sender] += quantity;

        emit WhitelistMinted(msg.sender, quantity);

        emit BatchMinted(msg.sender, quantity, startTokenId);
    }

    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }

    function getRemainingWhiteListMints(
        address user
    ) external view returns (uint256) {
        if (!whitelist[user]) {
            return 0;
        }

        return maxWhitelistMints - whitelistMinted[user];
    }

    function getWhitelistMintedCount(
        address user
    ) external view returns (uint256) {
        return whitelistMinted[user];
    }

    function getCurrentAuctionPrice() public view returns (uint256) {
        if (!auctionActive) {
            return auctionStartPrice;
        }

        if (block.timestamp < auctionStartTime) {
            return auctionStartPrice;
        }

        uint256 timeElapsed = block.timestamp - auctionStartTime;

        if (timeElapsed >= auctionDuration) {
            return auctionEndPrice;
        }

        uint256 dropIntervals = timeElapsed / auctionPriceDropInterval;

        uint256 totalDropIntervals = auctionDuration / auctionPriceDropInterval;

        if (dropIntervals = 0) {
            return auctionStartPrice;
        }

        uint256 totalPriceDrop = auctionStartPrice - auctionEndPrice;
        uint256 priceDropPerInterval = totalPriceDrop / totalDropIntervals;

        uint256 currentPrice = auctionStartPrice -
            (dropIntervals * priceDropPerInterval);

        if (currentPrice < auctionEndPrice) {
            return auctionEndPrice;
        }

        return currentPrice;
    }

    function startAuction(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 priceDropInterval
    ) external onlyOwner {
        require(!auctionActive, "Auction already active");
        require(
            startPrice > endPrice,
            "Start price must be higher than the end price"
        );
        require(duration > 0, "Duration must be greater than 0");
        require(
            priceDropInterval > 0 && priceDropInterval <= duration,
            "Invalid price drop interval"
        );

        auctionStartPrice = startPrice;
        auctionEndPrice = endPrice;
        auctionDuration = duration;
        auctionPriceDropInterval = priceDropInterval;
        auctionStartTime = block.timestamp;
        auctionActive = true;

        emit AuctionStarted(startPrice, endPrice, duration, block.timestamp);
    }

    function endAuction() external onlyOwner {
        require(auctionActive, "Auction not active");
        auctionActive = false;
        emit AuctionEnded();
    }

    function setAuctionParameters(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 priceDropInterval
    ) external onlyOwner {
        require(
            !auctionActive,
            "Cannot update parameters during active auction"
        );
        require(
            startPrice > endPrice,
            "Start price must be higher than the end price"
        );
        require(duration > 0, "Duration must be greater than 0");
        require(
            priceDropInterval > 0 && priceDropInterval <= duration,
            "Invalid price drop interval"
        );

        auctionStartPrice = startPrice;
        auctionEndPrice = endPrice;
        auctionDuration = duration;
        auctionPriceDropInterval = priceDropInterval;

        emit AuctionPriceUpdated(startPrice, endPrice, duration);
    }

    function auctionMint(
        uint256 quantity
    ) external payable whenNotPaused nonReentrant {
        require(auctionActive, "Auction not active");
        require(block.timestamp >= auctionStartTime, "Auction not started yet");
        require(
            quantity > 0 && quantity <= 10,
            "Invalid quanity:1-10 tokens allowed"
        );
        require(currentSupply + quantity <= maxSupply, "Exceeds max supply");

        uint256 currentPrice = getCurrentAuctionPrice();
        uint256 totalCost = currentPrice * quantity;
        require(msg.value >= totalCost, "Insufficient payment");

        uint256 startTokenId = tokenIds.current();

        for (uint256 i = 0; i < quantity; i++) {
            uint256 selectedRarityTier = _generateRandomRarity();
            uint256 tokenId = tokenIds.current();

            _safeMint(msg.sender, tokenId);
            tokenIds.increment();

            currentSupply++;

            tokenToRarity[tokenId] = selectedRarityTier;
            rarityTiers[selectedRarityTier].currentSupply++;
            _setTokenURI(tokenId, _constructTokenURI(tokenId));

            emit TokenMinted(
                msg.sender,
                tokenId,
                selectedRarityTier,
                rarityTiers[selectedRarityTier].name
            );
        }

        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit AuctionMinted(msg.sender, quantity, totalCost, currentPrice);
        emit BatchMinted(msg.sender, quantity, startTokenId);
    }

    function getAuctionStatus()
        external
        view
        returns (bool isActive, uint256 currentPrice, uint256 timeRemaining)
    {
        isActive = auctionActive;
        currentPrice = getCurrentAuctionPrice();
        if (!auctionActive || block.timestamp < auctionStartTime) {
            timeRemaining = 0;
        } else if (block.timestamp >= auctionStartTime + auctionDuration) {
            timeRemaining = 0;
        } else {
            timeRemaining =
                (auctionStartTime + auctionDuration) -
                block.timestamp;
        }

        return (isActive, currentPrice, timeRemaining);
    }

    function hasAuctionEnded() external view returns (bool) {
        if (!auctionActive) return true;
        return block.timestamp >= auctionStartTime + auctionDuration;
    }

    function getNextPriceDropTime() external view returns (uint256) {
        if (!auctionActive || block.timestamp < auctionStartTime) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - auctionStartTime;
        uint256 currentInterval = timeElapsed / auctionPriceDropInterval;
        uint256 nextDropTime = auctionStartTime +
            ((currentInterval + 1) * auctionPriceDropInterval);

        if (nextDropTime >= auctionStartTime + auctionDuration) {
            return 0;
        }

        return nextDropTime;
    }
}
