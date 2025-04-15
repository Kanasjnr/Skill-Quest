import { ethers, network } from "hardhat"
import * as fs from "fs"
import * as path from "path"

async function main() {
  console.log("Starting SkillQuest deployment...")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying contracts with the account: ${deployer.address}`)

  // Get balance using provider instead of directly from signer
  const initialBalance = await ethers.provider.getBalance(deployer.address)
  console.log(`Account balance: ${ethers.formatEther(initialBalance)} ETH`)

  // Deploy SkillQuestToken
  console.log("Deploying SkillQuestToken...")
  const SkillQuestTokenFactory = await ethers.getContractFactory("SkillQuestToken")
  const token = await SkillQuestTokenFactory.deploy(deployer.address)
  await token.waitForDeployment()

  const tokenAddress = await token.getAddress()
  console.log(`SkillQuestToken deployed to: ${tokenAddress}`)

  // Deploy SkillQuest platform
  console.log("Deploying SkillQuest platform...")
  const SkillQuestFactory = await ethers.getContractFactory("SkillQuest")
  const platform = await SkillQuestFactory.deploy(tokenAddress)
  await platform.waitForDeployment()

  const platformAddress = await platform.getAddress()
  console.log(`SkillQuest platform deployed to: ${platformAddress}`)

  // Transfer tokens to the platform for rewards
  console.log("Setting up reward pool...")
  const rewardPoolAmount = ethers.parseEther("30000000") // 30 million tokens

  // Approve the platform to spend tokens
  console.log("Approving tokens for the platform...")
  const approveTx = await token.approve(platformAddress, rewardPoolAmount)
  await approveTx.wait()
  console.log("Approved platform to spend tokens")

  // Transfer tokens to the platform
  console.log("Transferring tokens to the platform...")
  const transferTx = await token.transfer(platformAddress, rewardPoolAmount)
  await transferTx.wait()
  console.log(`Transferred ${ethers.formatEther(rewardPoolAmount)} LEARN tokens to the platform`)

  // Log deployment costs
  const finalBalance = await ethers.provider.getBalance(deployer.address)
  const deploymentCost = initialBalance - finalBalance
  console.log(`Total deployment cost: ${ethers.formatEther(deploymentCost)} ETH`)

  // Save deployment information to a file
  const deploymentInfo = {
    network: network.name,
    tokenAddress: tokenAddress,
    platformAddress: platformAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  }

  // Create deployments directory if it doesn't exist
  const deploymentPath = path.join(__dirname, "../deployments")
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true })
  }

  // Write deployment info to file
  fs.writeFileSync(
    path.join(deploymentPath, `${network.name}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2),
  )

  console.log("Deployment completed successfully!")
  console.log(deploymentInfo)

  // Output verification command
  console.log("\nTo verify contracts on the explorer (if supported):")
  console.log(`npx hardhat verify --network ${network.name} ${tokenAddress} ${deployer.address}`)
  console.log(`npx hardhat verify --network ${network.name} ${platformAddress} ${tokenAddress}`)
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
