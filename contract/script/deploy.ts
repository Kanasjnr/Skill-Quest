import { ethers, network } from "hardhat"
import * as fs from "fs"
import * as path from "path"

// Helper function to wait between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to retry failed transactions
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 5000
): Promise<T> {
  let lastError: Error = new Error("Operation failed after all retries")
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: unknown) {
      console.log(`Attempt ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`)
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delayMs/1000} seconds...`)
        await sleep(delayMs)
      }
    }
  }
  throw lastError
}

async function main() {
  console.log("Starting SkillQuest deployment...")
  console.log(`Network: ${network.name}`)

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying contracts with the account: ${deployer.address}`)

  // Get balance using provider instead of directly from signer
  const initialBalance = await ethers.provider.getBalance(deployer.address)
  console.log(`Account balance: ${ethers.formatEther(initialBalance)} PHRS`)

  // Check if balance is sufficient
  const minBalance = ethers.parseEther("0.1") // Minimum 0.1 PHRS for deployment
  if (initialBalance < minBalance) {
    throw new Error(`Insufficient balance. Please get some test PHRS from the Pharos Testnet faucet`)
  }

  // Set gas price for Pharos network
  const gasPrice = await ethers.provider.getFeeData()
  const maxFeePerGas = gasPrice.maxFeePerGas || ethers.parseUnits("5", "gwei")
  const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || ethers.parseUnits("1", "gwei")

  // Deploy SkillQuestToken
  console.log("Deploying SkillQuestToken...")
  const SkillQuestTokenFactory = await ethers.getContractFactory("SkillQuestToken")
  const token = await retryOperation(() => 
    SkillQuestTokenFactory.deploy(deployer.address, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
  )
  await token.waitForDeployment()

  const tokenAddress = await token.getAddress()
  console.log(`SkillQuestToken deployed to: ${tokenAddress}`)

  // Deploy SkillQuest platform
  console.log("Deploying SkillQuest platform...")
  const SkillQuestFactory = await ethers.getContractFactory("SkillQuest")
  const platform = await retryOperation(() =>
    SkillQuestFactory.deploy(tokenAddress, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
  )
  await platform.waitForDeployment()

  const platformAddress = await platform.getAddress()
  console.log(`SkillQuest platform deployed to: ${platformAddress}`)

  // Transfer tokens to the platform for rewards
  console.log("Setting up reward pool...")
  const rewardPoolAmount = ethers.parseEther("30000000") // 30 million tokens

  // Approve the platform to spend tokens
  console.log("Approving tokens for the platform...")
  const approveTx = await retryOperation(() =>
    token.approve(platformAddress, rewardPoolAmount, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
  )
  await approveTx.wait()
  console.log("Approved platform to spend tokens")

  // Transfer tokens to the platform
  console.log("Transferring tokens to the platform...")
  const transferTx = await retryOperation(() =>
    token.transfer(platformAddress, rewardPoolAmount, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
  )
  await transferTx.wait()
  console.log(`Transferred ${ethers.formatEther(rewardPoolAmount)} LEARN tokens to the platform`)

  // Log deployment costs
  const finalBalance = await ethers.provider.getBalance(deployer.address)
  const deploymentCost = initialBalance - finalBalance
  console.log(`Total deployment cost: ${ethers.formatEther(deploymentCost)} PHRS`)

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
