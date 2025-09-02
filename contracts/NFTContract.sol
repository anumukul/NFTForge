// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error MaxSupplyReached();
error ZeroAddress();
error RarityTierExhausted();
error InvalidQuantity();
error ExceedsMaxSupply();
error InvalidRarityTier();
error TokenNotExist();
error NotTokenOwner();
error TokenAlreadyStaked();
error TokenNotStaked();
error StakingNotEnabled();
error WhitelistNotActive();
error NotWhitelisted();
error ExceedWhitelistLimit();
error AuctionNotActive();
error InsufficientPayment();
error InvalidIndex();
error EmptyArray();
error TooManyTokens();
error InvalidTierIndex();
error MaxSupplyTooLow();
error AlreadyRevealed();
error NotRevealed();
error InvalidAddress();
error RoyaltyTooHigh();
error NoFunds();
error WithdrawFailed();
error TransferFailed();
error ContractStopped();

contract NFTContract is
    ERC721,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    Pausable,
    IERC2981,
    AccessControl
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private tokenIds;
    uint256 public constant maxSupply = 1000;
    uint256 public constant MAX_MINT_PER_TX = 10;
    uint256 public currentSupply;
    string public baseURI;
    string public _contractURI;
    bool public revealed;
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
    bool public whitelistPhaseActive;

    uint256 public auctionStartPrice = 1 ether;
    uint256 public auctionEndPrice = 0.1 ether;
    uint256 public auctionStartTime;
    uint256 public auctionDuration = 3600;
    uint256 public auctionPriceDropInterval = 300;
    bool public auctionActive;

    address private _royaltyRecipient;
    uint96 private _royaltyFee = 750;

    mapping(uint256 => bool) public stakedTokens;
    mapping(uint256 => uint256) public stakingStartTime;
    mapping(address => uint256[]) public userStakedTokens;
    bool public stakingEnabled;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");

    bool public emergencyStop;
    address public withdrawAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        string memory contractURI_,
        string memory _hiddenMetaDataURI,
        address royaltyRecipient_,
        address withdrawAddress_
    ) ERC721(_name, _symbol) {
        if (royaltyRecipient_ == address(0)) revert ZeroAddress();
        if (withdrawAddress_ == address(0)) revert ZeroAddress();

        baseURI = _baseURI;
        _contractURI = contractURI_;
        hiddenMetaDataURI = _hiddenMetaDataURI;
        _royaltyRecipient = royaltyRecipient_;
        withdrawAddress = withdrawAddress_;

        tokenIds.increment();
        _initializeRarityTiers();

        randomSeed = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        );
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(STAKING_ROLE, msg.sender);
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
        if (index >= rarityTiers.length) revert InvalidIndex();
        return rarityTiers[index];
    }

    function getRarityTierCount() external view returns (uint256) {
        return rarityTiers.length;
    }

    function getTokenRarity(
        uint256 tokenId
    ) external view returns (RarityTier memory) {
        if (!_exists(tokenId)) revert TokenNotExist();
        return rarityTiers[tokenToRarity[tokenId]];
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
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
    event RoyaltyUpdated(address recipient, uint96 fee);
    event TokenStaked(uint256 indexed tokenId, address indexed owner);
    event TokenUnstaked(uint256 indexed tokenId, address indexed owner);
    event StakingToggled(bool enabled);
    event EmergencyStopToggled(bool stopped);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    event ERC20Recovered(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );
    event WithdrawAddressUpdated(address indexed newAddress);

    function _generateRandomRarity() private returns (uint256) {
        randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    randomSeed,
                    block.timestamp,
                    block.prevrandao,
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
        revert RarityTierExhausted();
    }

    function mint(
        address to
    ) external whenNotPaused whenNotStopped nonReentrant {
        if (currentSupply >= maxSupply) revert MaxSupplyReached();
        if (to == address(0)) revert ZeroAddress();

        uint256 selectedRarityTier = _generateRandomRarity();
        if (
            rarityTiers[selectedRarityTier].currentSupply >=
            rarityTiers[selectedRarityTier].maxSupply
        ) revert RarityTierExhausted();

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
        return
            revealed
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : hiddenMetaDataURI;
    }

    function ownerMint(address to, uint256 rarityTierIndex) external onlyOwner {
        if (currentSupply >= maxSupply) revert MaxSupplyReached();
        if (to == address(0)) revert ZeroAddress();
        if (rarityTierIndex >= rarityTiers.length) revert InvalidRarityTier();
        if (
            rarityTiers[rarityTierIndex].currentSupply >=
            rarityTiers[rarityTierIndex].maxSupply
        ) revert RarityTierExhausted();

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
        if (rarityTierIndex >= rarityTiers.length) revert InvalidRarityTier();
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
        if (rarityTierIndex >= rarityTiers.length) revert InvalidIndex();
        return
            rarityTiers[rarityTierIndex].currentSupply <
            rarityTiers[rarityTierIndex].maxSupply;
    }

    function batchMint(
        address to,
        uint256 quantity
    ) external whenNotPaused whenNotStopped nonReentrant {
        if (quantity == 0 || quantity > MAX_MINT_PER_TX)
            revert InvalidQuantity();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();
        if (to == address(0)) revert ZeroAddress();

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
        if (!_exists(tokenId)) revert TokenNotExist();
        if (!revealed) return hiddenMetaDataURI;

        string memory _tokenURI = super.tokenURI(tokenId);
        return
            bytes(_tokenURI).length > 0
                ? _tokenURI
                : string(
                    abi.encodePacked(baseURI, tokenId.toString(), ".json")
                );
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
        if (revealed) revert AlreadyRevealed();
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
        if (!_exists(tokenId)) revert TokenNotExist();
        if (!revealed) revert NotRevealed();
        _setTokenURI(tokenId, newURI);
        emit TokenMetaDataUpdated(tokenId, newURI);
    }

    function migrateToIPFS(string calldata newIPFSBaseURI) external onlyOwner {
        if (!revealed) revert NotRevealed();
        baseURI = newIPFSBaseURI;
        emit BaseURIUpdated(newIPFSBaseURI);
    }

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        if (addresses.length == 0) revert EmptyArray();
        for (uint256 i = 0; i < addresses.length; i++) {
            if (addresses[i] == address(0)) revert ZeroAddress();
            whitelist[addresses[i]] = true;
            emit WhitelistUpdated(addresses[i], true);
        }
    }

    function removeFromWhitelist(
        address[] calldata addresses
    ) external onlyOwner {
        if (addresses.length == 0) revert EmptyArray();
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
        maxWhitelistMints = maxMints;
    }

    function whitelistMint(
        uint256 quantity
    ) external whenNotPaused whenNotStopped nonReentrant {
        if (!whitelistPhaseActive) revert WhitelistNotActive();
        if (!whitelist[msg.sender]) revert NotWhitelisted();
        if (quantity == 0) revert InvalidQuantity();
        if (whitelistMinted[msg.sender] + quantity > maxWhitelistMints)
            revert ExceedWhitelistLimit();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();

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
        return whitelist[user] ? maxWhitelistMints - whitelistMinted[user] : 0;
    }

    function getWhitelistMintedCount(
        address user
    ) external view returns (uint256) {
        return whitelistMinted[user];
    }

    function getCurrentAuctionPrice() public view returns (uint256) {
        if (!auctionActive || block.timestamp < auctionStartTime)
            return auctionStartPrice;
        uint256 timeElapsed = block.timestamp - auctionStartTime;
        if (timeElapsed >= auctionDuration) return auctionEndPrice;

        uint256 dropIntervals = timeElapsed / auctionPriceDropInterval;
        if (dropIntervals == 0) return auctionStartPrice;

        uint256 totalDropIntervals = auctionDuration / auctionPriceDropInterval;
        uint256 totalPriceDrop = auctionStartPrice - auctionEndPrice;
        uint256 priceDropPerInterval = totalPriceDrop / totalDropIntervals;
        uint256 currentPrice = auctionStartPrice -
            (dropIntervals * priceDropPerInterval);

        return currentPrice < auctionEndPrice ? auctionEndPrice : currentPrice;
    }

    function startAuction(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 priceDropInterval
    ) external onlyOwner {
        if (auctionActive) revert AuctionNotActive();
        auctionStartPrice = startPrice;
        auctionEndPrice = endPrice;
        auctionDuration = duration;
        auctionPriceDropInterval = priceDropInterval;
        auctionStartTime = block.timestamp;
        auctionActive = true;
        emit AuctionStarted(startPrice, endPrice, duration, block.timestamp);
    }

    function endAuction() external onlyOwner {
        if (!auctionActive) revert AuctionNotActive();
        auctionActive = false;
        emit AuctionEnded();
    }

    function setAuctionParameters(
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        uint256 priceDropInterval
    ) external onlyOwner {
        if (auctionActive) revert AuctionNotActive();
        auctionStartPrice = startPrice;
        auctionEndPrice = endPrice;
        auctionDuration = duration;
        auctionPriceDropInterval = priceDropInterval;
        emit AuctionPriceUpdated(startPrice, endPrice, duration);
    }

    function auctionMint(
        uint256 quantity
    ) external payable whenNotPaused whenNotStopped nonReentrant {
        if (!auctionActive || block.timestamp < auctionStartTime)
            revert AuctionNotActive();
        if (quantity == 0 || quantity > MAX_MINT_PER_TX)
            revert InvalidQuantity();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();

        uint256 currentPrice = getCurrentAuctionPrice();
        uint256 totalCost = currentPrice * quantity;
        if (msg.value < totalCost) revert InsufficientPayment();

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
        timeRemaining = (!auctionActive ||
            block.timestamp < auctionStartTime ||
            block.timestamp >= auctionStartTime + auctionDuration)
            ? 0
            : (auctionStartTime + auctionDuration) - block.timestamp;
        return (isActive, currentPrice, timeRemaining);
    }

    function hasAuctionEnded() external view returns (bool) {
        return
            !auctionActive ||
            block.timestamp >= auctionStartTime + auctionDuration;
    }

    function getNextPriceDropTime() external view returns (uint256) {
        if (!auctionActive || block.timestamp < auctionStartTime) return 0;
        uint256 timeElapsed = block.timestamp - auctionStartTime;
        uint256 currentInterval = timeElapsed / auctionPriceDropInterval;
        uint256 nextDropTime = auctionStartTime +
            ((currentInterval + 1) * auctionPriceDropInterval);
        return
            nextDropTime >= auctionStartTime + auctionDuration
                ? 0
                : nextDropTime;
    }

    function setRoyaltyInfo(address recipient, uint96 fee) external onlyOwner {
        if (fee > 1000) revert RoyaltyTooHigh();
        if (recipient == address(0)) revert ZeroAddress();
        _royaltyRecipient = recipient;
        _royaltyFee = fee;
        emit RoyaltyUpdated(recipient, fee);
    }

    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        return (_royaltyRecipient, (salePrice * _royaltyFee) / 10000);
    }

    function toggleStaking() external onlyRole(ADMIN_ROLE) {
        stakingEnabled = !stakingEnabled;
        emit StakingToggled(stakingEnabled);
    }

    function stake(uint256 tokenId) external nonReentrant {
        if (!stakingEnabled) revert StakingNotEnabled();
        if (!_exists(tokenId)) revert TokenNotExist();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (stakedTokens[tokenId]) revert TokenAlreadyStaked();

        stakedTokens[tokenId] = true;
        stakingStartTime[tokenId] = block.timestamp;
        userStakedTokens[msg.sender].push(tokenId);
        emit TokenStaked(tokenId, msg.sender);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        if (!stakingEnabled) revert StakingNotEnabled();
        if (!_exists(tokenId)) revert TokenNotExist();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!stakedTokens[tokenId]) revert TokenNotStaked();

        stakedTokens[tokenId] = false;
        stakingStartTime[tokenId] = 0;

        uint256[] storage userTokens = userStakedTokens[msg.sender];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
        emit TokenUnstaked(tokenId, msg.sender);
    }

    function getStakingDuration(
        uint256 tokenId
    ) external view returns (uint256) {
        return
            (!stakedTokens[tokenId] || stakingStartTime[tokenId] == 0)
                ? 0
                : block.timestamp - stakingStartTime[tokenId];
    }

    function getUserStakedTokens(
        address user
    ) external view returns (uint256[] memory) {
        return userStakedTokens[user];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256
    ) internal override {
        if (stakedTokens[tokenId]) revert TokenAlreadyStaked();
        super._beforeTokenTransfer(from, to, tokenId, 1);
    }

    function grantRole(
        bytes32 role,
        address account
    ) public override onlyOwner {
        _grantRole(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    ) public override onlyOwner {
        _revokeRole(role, account);
    }

    function adminMint(
        address to,
        uint256 quantity
    ) external onlyRole(MINTER_ROLE) {
        if (quantity == 0) revert InvalidQuantity();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();

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

    function setEmergencyStop(bool stopped) external onlyOwner {
        emergencyStop = stopped;
        stopped ? _pause() : _unpause();
        emit EmergencyStopToggled(stopped);
    }

    function setWithdrawAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert ZeroAddress();
        withdrawAddress = newAddress;
        emit WithdrawAddressUpdated(newAddress);
    }

    function withdraw() external onlyOwner nonReentrant {
        if (withdrawAddress == address(0)) revert InvalidAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFunds();
        (bool success, ) = withdrawAddress.call{value: balance}("");
        if (!success) revert WithdrawFailed();
    }

    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFunds();
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
        emit EmergencyWithdrawal(owner(), balance);
    }

    function recoverERC20(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        IERC20(token).transfer(owner(), amount);
        emit ERC20Recovered(token, owner(), amount);
    }

    function recoverERC721(address token, uint256 tokenId) external onlyOwner {
        IERC721(token).transferFrom(address(this), owner(), tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    modifier whenNotStopped() {
        if (emergencyStop) revert ContractStopped();
        _;
    }

    function updateRarityTier(
        uint256 tierIndex,
        string calldata name,
        uint256 probability,
        uint256 maxSupplyTier,
        string calldata specialAttribute
    ) external onlyOwner {
        if (tierIndex >= rarityTiers.length) revert InvalidTierIndex();
        if (maxSupplyTier < rarityTiers[tierIndex].currentSupply)
            revert MaxSupplyTooLow();

        RarityTier storage tier = rarityTiers[tierIndex];
        tier.name = name;
        tier.probability = probability;
        tier.maxSupply = maxSupplyTier;
        tier.specialAttribute = specialAttribute;
        rarityNameToIndex[name] = tierIndex;
    }

    function getTotalRarityProbability() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < rarityTiers.length; i++) {
            total += rarityTiers[i].probability;
        }
        return total;
    }

    function getAllRarityTiers() external view returns (RarityTier[] memory) {
        return rarityTiers;
    }

    function getContractStats()
        external
        view
        returns (
            uint256 totalSupply,
            uint256 remainingSupply,
            uint256 totalRarityTiers,
            bool isRevealed,
            bool isStakingEnabled,
            bool isWhitelistPhaseActive,
            bool isAuctionActive
        )
    {
        return (
            currentSupply,
            maxSupply - currentSupply,
            rarityTiers.length,
            revealed,
            stakingEnabled,
            whitelistPhaseActive,
            auctionActive
        );
    }

    function batchStake(uint256[] calldata tokenIdList) external nonReentrant {
        if (!stakingEnabled) revert StakingNotEnabled();
        if (tokenIdList.length == 0) revert EmptyArray();
        if (tokenIdList.length > 20) revert TooManyTokens();

        for (uint256 i = 0; i < tokenIdList.length; i++) {
            uint256 tokenId = tokenIdList[i];
            if (!_exists(tokenId)) revert TokenNotExist();
            if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
            if (stakedTokens[tokenId]) revert TokenAlreadyStaked();

            stakedTokens[tokenId] = true;
            stakingStartTime[tokenId] = block.timestamp;
            userStakedTokens[msg.sender].push(tokenId);
            emit TokenStaked(tokenId, msg.sender);
        }
    }

    function batchUnstake(
        uint256[] calldata tokenIdList
    ) external nonReentrant {
        if (!stakingEnabled) revert StakingNotEnabled();
        if (tokenIdList.length == 0) revert EmptyArray();
        if (tokenIdList.length > 20) revert TooManyTokens();

        for (uint256 i = 0; i < tokenIdList.length; i++) {
            uint256 tokenId = tokenIdList[i];
            if (!_exists(tokenId)) revert TokenNotExist();
            if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
            if (!stakedTokens[tokenId]) revert TokenNotStaked();

            stakedTokens[tokenId] = false;
            stakingStartTime[tokenId] = 0;

            uint256[] storage userTokens = userStakedTokens[msg.sender];
            for (uint256 j = 0; j < userTokens.length; j++) {
                if (userTokens[j] == tokenId) {
                    userTokens[j] = userTokens[userTokens.length - 1];
                    userTokens.pop();
                    break;
                }
            }
            emit TokenUnstaked(tokenId, msg.sender);
        }
    }

    function isTokenStaked(uint256 tokenId) external view returns (bool) {
        return stakedTokens[tokenId];
    }

    function getTotalStakedByUser(
        address user
    ) external view returns (uint256) {
        return userStakedTokens[user].length;
    }

    function pauseContract() external onlyOwner {
        _pause();
    }

    function unpauseContract() external onlyOwner {
        _unpause();
    }
}
