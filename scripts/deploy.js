const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const NFTContract = await hre.ethers.getContractFactory("NFTContract");
  
  const nftContract = await NFTContract.deploy(
    "My NFT Collection",
    "MNFT",
    "https://api.example.com/metadata/",
    "https://api.example.com/contract.json", 
    "https://api.example.com/hidden.json",
    deployer.address,
    deployer.address
  );

  await nftContract.deployed();
  console.log("Contract deployed to:", nftContract.address);
  
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await nftContract.deployTransaction.wait(5);
    
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: nftContract.address,
      constructorArguments: [
        "My NFT Collection",
        "MNFT", 
        "https://api.example.com/metadata/",
        "https://api.example.com/contract.json",
        "https://api.example.com/hidden.json",
        deployer.address,
        deployer.address
      ]
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});