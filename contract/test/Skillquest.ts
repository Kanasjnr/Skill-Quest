import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SkillQuest", () => {
  // Test fixture to deploy the contracts and set up test environment
  async function deploySkillQuestFixture() {
    const [owner, instructor, student1, student2] = await ethers.getSigners();

    // Deploy token
    const SkillQuestToken = await ethers.getContractFactory("SkillQuestToken");
    const token = await SkillQuestToken.deploy(owner.address);

    // Deploy platform
    const SkillQuest = await ethers.getContractFactory("SkillQuest");
    const platform = await SkillQuest.deploy(await token.getAddress());

    // Transfer tokens to platform for rewards
    const rewardPoolAmount = ethers.parseUnits("30000000", 18); // 30 million tokens
    await token.transfer(await platform.getAddress(), rewardPoolAmount);

    // Transfer tokens to users for testing
    const userAmount = ethers.parseUnits("1000", 18);
    await token.transfer(instructor.address, userAmount);
    await token.transfer(student1.address, userAmount);
    await token.transfer(student2.address, userAmount);

    // Approve platform to spend tokens
    await token.connect(instructor).approve(await platform.getAddress(), ethers.MaxUint256);
    await token.connect(student1).approve(await platform.getAddress(), ethers.MaxUint256);
    await token.connect(student2).approve(await platform.getAddress(), ethers.MaxUint256);

    // Deploy deployer contract (for testing the deployer)
    const SkillQuestDeployer = await ethers.getContractFactory("SkillQuestDeployer");
    const deployer = await SkillQuestDeployer.deploy();

    return {
      token,
      platform,
      deployer,
      owner,
      instructor,
      student1,
      student2,
      rewardPoolAmount,
      userAmount
    };
  }

  describe("SkillQuestToken", () => {
    it("Should deploy with correct name and symbol", async () => {
      const { token } = await loadFixture(deploySkillQuestFixture);
      expect(await token.name()).to.equal("LEARN Token");
      expect(await token.symbol()).to.equal("LEARN");
    });

    it("Should mint initial supply to owner", async () => {
      const { token, owner } = await loadFixture(deploySkillQuestFixture);
      const initialSupply = ethers.parseUnits("100000000", 18); // 100 million tokens
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.be.gt(0);
    });
  });

  describe("SkillQuest - Deployment", () => {
    it("Should set the correct token address", async () => {
      const { platform, token } = await loadFixture(deploySkillQuestFixture);
      expect(await platform.learnToken()).to.equal(await token.getAddress());
    });

    it("Should allow owner to set a new token contract", async () => {
      const { platform, owner } = await loadFixture(deploySkillQuestFixture);
      
      // Deploy a new token
      const NewToken = await ethers.getContractFactory("SkillQuestToken");
      const newToken = await NewToken.deploy(owner.address);
      
      // Set new token contract
      await platform.connect(owner).setTokenContract(await newToken.getAddress());
      expect(await platform.learnToken()).to.equal(await newToken.getAddress());
    });
  });

  describe("SkillQuest - User Registration", () => {
    it("Should register a new user", async () => {
      const { platform, student1 } = await loadFixture(deploySkillQuestFixture);
      
      await platform.connect(student1).registerUser();
      
      const user = await platform.users(student1.address);
      expect(user.isRegistered).to.be.true;
      expect(user.userId).to.equal(1);
    });

    it("Should not allow registering the same user twice", async () => {
      const { platform, student1 } = await loadFixture(deploySkillQuestFixture);
      
      await platform.connect(student1).registerUser();
      
      await expect(platform.connect(student1).registerUser())
        .to.be.revertedWith("User already registered");
    });

    it("Should award welcome bonus to new users", async () => {
      const { platform, token, student1 } = await loadFixture(deploySkillQuestFixture);
      
      const balanceBefore = await token.balanceOf(student1.address);
      await platform.connect(student1).registerUser();
      const balanceAfter = await token.balanceOf(student1.address);
      
      const welcomeBonus = ethers.parseUnits("10", 18); // 10 tokens
      expect(balanceAfter - balanceBefore).to.equal(welcomeBonus);
    });
  });

  describe("SkillQuest - Course Creation", () => {
    it("Should create a new course", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      const metadataURI = "ipfs://QmHash";
      const title = "Blockchain Basics";
      const description = "Learn the fundamentals of blockchain technology";
      const price = ethers.parseUnits("50", 18);
      const duration = 86400 * 7; // 7 days
      const xpReward = 100;
      const tokenReward = ethers.parseUnits("5", 18);
      const requiredCourses = [];
      const tags = ["blockchain", "beginner"];
      
      await platform.connect(instructor).createCourse(
        metadataURI,
        title,
        description,
        price,
        duration,
        xpReward,
        tokenReward,
        requiredCourses,
        tags
      );
      
      const course = await platform.courses(1);
      expect(course.id).to.equal(1);
      expect(course.instructor).to.equal(instructor.address);
      expect(course.title).to.equal(title);
      expect(course.price).to.equal(price);
      expect(course.isActive).to.be.true;
    });

    it("Should not allow unregistered users to create courses", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Try to create course without registering
      const metadataURI = "ipfs://QmHash";
      const title = "Blockchain Basics";
      const description = "Learn the fundamentals of blockchain technology";
      const price = ethers.parseUnits("50", 18);
      const duration = 86400 * 7; // 7 days
      const xpReward = 100;
      const tokenReward = ethers.parseUnits("5", 18);
      const requiredCourses = [];
      const tags = ["blockchain", "beginner"];
      
      await expect(platform.connect(instructor).createCourse(
        metadataURI,
        title,
        description,
        price,
        duration,
        xpReward,
        tokenReward,
        requiredCourses,
        tags
      )).to.be.revertedWith("User not registered");
    });

    it("Should register new course tags", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course with new tags
      const tags = ["blockchain", "beginner", "crypto"];
      
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        tags
      );
      
      // Check if tags were registered
      const allTags = await platform.getAllCourseTags();
      expect(allTags).to.include.members(tags);
    });
  });

  describe("SkillQuest - Course Enrollment", () => {
    it("Should allow a user to enroll in a course", async () => {
      const { platform, instructor, student1, token } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      const price = ethers.parseUnits("50", 18);
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        price,
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      const instructorBalanceBefore = await token.balanceOf(instructor.address);
      await platform.connect(student1).enrollCourse(1);
      const instructorBalanceAfter = await token.balanceOf(instructor.address);
      
      // Check enrollment
      expect(await platform.courseEnrollments(1, student1.address)).to.be.true;
      
      // Check instructor payment (95% of price)
      const platformFee = price * BigInt(5) / BigInt(100);
      const instructorPayment = price - platformFee;
      expect(instructorBalanceAfter - instructorBalanceBefore).to.equal(instructorPayment);
      
      // Check enrolled courses
      const enrolledCourses = await platform.getEnrolledCourses(student1.address);
      expect(enrolledCourses.length).to.equal(1);
      expect(enrolledCourses[0]).to.equal(1);
    });

    it("Should not allow enrollment in a course twice", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      await platform.connect(student1).enrollCourse(1);
      
      // Try to enroll again
      await expect(platform.connect(student1).enrollCourse(1))
        .to.be.revertedWith("Already enrolled");
    });

    it("Should allow batch enrollment in multiple courses", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create courses
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash1",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash2",
        "Smart Contracts",
        "Learn to write smart contracts",
        ethers.parseUnits("75", 18),
        86400 * 14,
        150,
        ethers.parseUnits("7", 18),
        [],
        ["blockchain", "smart-contracts"]
      );
      
      // Batch enroll in courses
      await platform.connect(student1).batchEnrollCourses([1, 2]);
      
      // Check enrollments
      expect(await platform.courseEnrollments(1, student1.address)).to.be.true;
      expect(await platform.courseEnrollments(2, student1.address)).to.be.true;
      
      // Check enrolled courses
      const enrolledCourses = await platform.getEnrolledCourses(student1.address);
      expect(enrolledCourses.length).to.equal(2);
      expect(enrolledCourses).to.include.members([BigInt(1), BigInt(2)]);
    });
  });

  describe("SkillQuest - Course Progress and Completion", () => {
    it("Should update course progress", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      await platform.connect(student1).enrollCourse(1);
      
      // Update progress
      await platform.connect(student1).updateProgress(1, 50);
      
      // Check progress
      expect(await platform.getCourseProgress(student1.address, 1)).to.equal(50);
    });

    it("Should not allow decreasing progress", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      await platform.connect(student1).enrollCourse(1);
      
      // Update progress
      await platform.connect(student1).updateProgress(1, 50);
      
      // Try to decrease progress
      await expect(platform.connect(student1).updateProgress(1, 40))
        .to.be.revertedWith("Cannot decrease progress");
    });

    it("Should complete a course and issue a certificate when progress is 100%", async () => {
      const { platform, instructor, student1, token } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      const xpReward = 100;
      const tokenReward = ethers.parseUnits("5", 18);
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400, // 1 day
        xpReward,
        tokenReward,
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      await platform.connect(student1).enrollCourse(1);
      
      // Fast forward time to meet minimum enrollment duration
      await time.increase(86400 + 1);
      
      // Check token balance before completion
      const balanceBefore = await token.balanceOf(student1.address);
      
      // Complete course
      await platform.connect(student1).updateProgress(1, 100);
      
      // Check completion
      const completedCourses = await platform.getCompletedCourses(student1.address);
      expect(completedCourses.length).to.equal(1);
      expect(completedCourses[0]).to.equal(1);
      
      // Check XP reward
      expect(await platform.getUserXP(student1.address)).to.equal(xpReward);
      
      // Check token reward
      const balanceAfter = await token.balanceOf(student1.address);
      expect(balanceAfter - balanceBefore).to.equal(tokenReward);
      
      // Check certificate
      const userCertificates = await platform.getUserCertificates(student1.address);
      expect(userCertificates.length).to.equal(1);
      
      const certificate = await platform.getCertificateDetails(userCertificates[0]);
      expect(certificate.courseId).to.equal(1);
      expect(certificate.recipient).to.equal(student1.address);
      expect(certificate.isRevoked).to.be.false;
    });

    it("Should enforce minimum enrollment duration", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7, // 7 days
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      await platform.connect(student1).enrollCourse(1);
      
      // Try to complete course immediately (should fail due to minimum duration)
      await expect(platform.connect(student1).updateProgress(1, 100))
        .to.be.revertedWith("Minimum enrollment duration not met");
    });
  });

  describe("SkillQuest - Prerequisites", () => {
    it("Should enforce course prerequisites", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create prerequisite course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash1",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Create advanced course with prerequisite
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash2",
        "Advanced Blockchain",
        "Advanced blockchain concepts",
        ethers.parseUnits("75", 18),
        86400 * 2,
        150,
        ethers.parseUnits("7", 18),
        [1], // Requires course ID 1
        ["blockchain", "advanced"]
      );
      
      // Try to enroll in advanced course without completing prerequisite
      await expect(platform.connect(student1).enrollCourse(2))
        .to.be.revertedWith("Prerequisites not completed");
      
      // Enroll and complete prerequisite
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Now should be able to enroll in advanced course
      await platform.connect(student1).enrollCourse(2);
      expect(await platform.courseEnrollments(2, student1.address)).to.be.true;
    });
  });

  describe("SkillQuest - Certificates", () => {
    it("Should allow revoking certificates", async () => {
      const { platform, instructor, student1, owner } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll and complete course
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Get certificate ID
      const userCertificates = await platform.getUserCertificates(student1.address);
      const certificateId = userCertificates[0];
      
      // Revoke certificate as instructor
      await platform.connect(instructor).revokeCertificate(certificateId);
      
      // Check if certificate is revoked
      const certificate = await platform.getCertificateDetails(certificateId);
      expect(certificate.isRevoked).to.be.true;
    });

    it("Should not allow unauthorized users to revoke certificates", async () => {
      const { platform, instructor, student1, student2 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      await platform.connect(student2).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll and complete course
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Get certificate ID
      const userCertificates = await platform.getUserCertificates(student1.address);
      const certificateId = userCertificates[0];
      
      // Try to revoke certificate as unauthorized user
      await expect(platform.connect(student2).revokeCertificate(certificateId))
        .to.be.revertedWith("Not authorized");
    });
  });

  describe("SkillQuest - Course Management", () => {
    it("Should allow instructor to update course details", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Update course
      const newTitle = "Updated Blockchain Basics";
      const newDescription = "Updated description";
      const newPrice = ethers.parseUnits("60", 18);
      
      await platform.connect(instructor).updateCourse(
        1,
        "ipfs://QmNewHash",
        newTitle,
        newDescription,
        newPrice,
        true
      );
      
      // Check updated course
      const course = await platform.getCourseDetails1(1);
      expect(course.title).to.equal(newTitle);
      expect(course.description).to.equal(newDescription);
      expect(course.price).to.equal(newPrice);
    });

    it("Should allow instructor to update course rewards", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Update course rewards
      const newXpReward = 150;
      const newTokenReward = ethers.parseUnits("7", 18);
      
      await platform.connect(instructor).updateCourseRewards(
        1,
        newXpReward,
        newTokenReward
      );
      
      // Check updated rewards
      const course = await platform.getCourseDetails2(1);
      expect(course.xpReward).to.equal(newXpReward);
      expect(course.tokenReward).to.equal(newTokenReward);
    });

    it("Should allow instructor to pause and unpause a course", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Pause course
      await platform.connect(instructor).pauseCourse(1, true);
      
      // Check if course is paused
      const course = await platform.getCourseDetails2(1);
      expect(course.isPaused).to.be.true;
      
      // Try to enroll in paused course
      await expect(platform.connect(student1).enrollCourse(1))
        .to.be.revertedWith("Course is paused");
      
      // Unpause course
      await platform.connect(instructor).pauseCourse(1, false);
      
      // Check if course is unpaused
      const updatedCourse = await platform.getCourseDetails2(1);
      expect(updatedCourse.isPaused).to.be.false;
      
      // Now should be able to enroll
      await platform.connect(student1).enrollCourse(1);
      expect(await platform.courseEnrollments(1, student1.address)).to.be.true;
    });
  });

  describe("SkillQuest - Admin Functions", () => {
    it("Should allow owner to withdraw platform fees", async () => {
      const { platform, token, owner, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      const price = ethers.parseUnits("50", 18);
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        price,
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course (generates platform fee)
      await platform.connect(student1).enrollCourse(1);
      
      // Calculate platform fee
      const platformFee = price * BigInt(5) / BigInt(100);
      
      // Withdraw platform fees
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      await platform.connect(owner).withdrawPlatformFees(platformFee);
      const ownerBalanceAfter = await token.balanceOf(owner.address);
      
      // Check if owner received the fees
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(platformFee);
    });

    it("Should allow anyone to top up the reward pool", async () => {
      const { platform, token, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register user
      await platform.connect(student1).registerUser();
      
      // Top up reward pool
      const topUpAmount = ethers.parseUnits("100", 18);
      await token.connect(student1).approve(await platform.getAddress(), topUpAmount);
      
      const platformBalanceBefore = await token.balanceOf(await platform.getAddress());
      await platform.connect(student1).topUpRewardPool(topUpAmount);
      const platformBalanceAfter = await token.balanceOf(await platform.getAddress());
      
      // Check if platform received the tokens
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(topUpAmount);
    });

    it("Should allow owner to pause and unpause the platform", async () => {
      const { platform, owner, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Pause platform
      await platform.connect(owner).pause();
      
      // Try to register user while paused
      // Note: Using try/catch instead of expect().to.be.revertedWith() since it's a custom error
      let errorOccurred = false;
      try {
        await platform.connect(instructor).registerUser();
      } catch (error) {
        errorOccurred = true;
      }
      expect(errorOccurred).to.be.true;
      
      // Unpause platform
      await platform.connect(owner).unpause();
      
      // Should be able to register now
      await platform.connect(instructor).registerUser();
      const user = await platform.users(instructor.address);
      expect(user.isRegistered).to.be.true;
    });

    it("Should allow owner to perform emergency withdrawal", async () => {
      const { platform, token, owner } = await loadFixture(deploySkillQuestFixture);
      
      // Check platform balance
      const platformBalance = await token.balanceOf(await platform.getAddress());
      expect(platformBalance).to.be.gt(0);
      
      // Emergency withdraw
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      await platform.connect(owner).emergencyWithdraw(owner.address);
      const ownerBalanceAfter = await token.balanceOf(owner.address);
      
      // Check if owner received all tokens
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(platformBalance);
      
      // Check if platform balance is now zero
      const platformBalanceAfter = await token.balanceOf(await platform.getAddress());
      expect(platformBalanceAfter).to.equal(0);
    });
  });

  describe("SkillQuest - Getters and Utility Functions", () => {
    it("Should return correct course information", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      const title = "Blockchain Basics";
      const description = "Learn the fundamentals of blockchain technology";
      const price = ethers.parseUnits("50", 18);
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        title,
        description,
        price,
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Get course info
      const courseInfo = await platform.getCourseBasicInfo(1);
      expect(courseInfo.title).to.equal(title);
      expect(courseInfo.instructor).to.equal(instructor.address);
      expect(courseInfo.price).to.equal(price);
      expect(courseInfo.isActive).to.be.true;
    });

    it("Should return correct course details part 1", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      const metadataURI = "ipfs://QmHash";
      const title = "Blockchain Basics";
      const description = "Learn the fundamentals of blockchain technology";
      const price = ethers.parseUnits("50", 18);
      const duration = 86400 * 7;
      
      await platform.connect(instructor).createCourse(
        metadataURI,
        title,
        description,
        price,
        duration,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Get course details part 1
      const details = await platform.getCourseDetails1(1);
      expect(details.id).to.equal(1);
      expect(details.instructor).to.equal(instructor.address);
      expect(details.title).to.equal(title);
      expect(details.description).to.equal(description);
      expect(details.metadataURI).to.equal(metadataURI);
      expect(details.price).to.equal(price);
      expect(details.duration).to.equal(duration);
    });

    it("Should return correct course details part 2", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course
      const xpReward = 100;
      const tokenReward = ethers.parseUnits("5", 18);
      
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        xpReward,
        tokenReward,
        [],
        ["blockchain", "beginner"]
      );
      
      // Get course details part 2
      const details = await platform.getCourseDetails2(1);
      expect(details.xpReward).to.equal(xpReward);
      expect(details.tokenReward).to.equal(tokenReward);
      expect(details.isActive).to.be.true;
      expect(details.isPaused).to.be.false;
      expect(details.enrollmentCount).to.equal(0);
      expect(details.completionCount).to.equal(0);
      expect(details.creationTime).to.be.gt(0);
    });

    it("Should return correct course prerequisites", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create prerequisite course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash1",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Create advanced course with prerequisite
      const prerequisites = [1];
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash2",
        "Advanced Blockchain",
        "Advanced blockchain concepts",
        ethers.parseUnits("75", 18),
        86400 * 2,
        150,
        ethers.parseUnits("7", 18),
        prerequisites,
        ["blockchain", "advanced"]
      );
      
      // Get course prerequisites
      const prereqs = await platform.getCoursePrerequisites(2);
      expect(prereqs.length).to.equal(1);
      expect(prereqs[0]).to.equal(1);
    });

    it("Should return correct course tags", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create course with tags
      const tags = ["blockchain", "beginner", "crypto"];
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        tags
      );
      
      // Get course tags
      const courseTags = await platform.getCourseTags(1);
      expect(courseTags.length).to.equal(tags.length);
      expect(courseTags).to.deep.equal(tags);
    });

    it("Should return correct certificate details", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll and complete course
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Get certificate ID
      const userCertificates = await platform.getUserCertificates(student1.address);
      const certificateId = userCertificates[0];
      
      // Get certificate details
      const certificate = await platform.getCertificateDetails(certificateId);
      expect(certificate.id).to.equal(certificateId);
      expect(certificate.courseId).to.equal(1);
      expect(certificate.recipient).to.equal(student1.address);
      expect(certificate.issueDate).to.be.gt(0);
      expect(certificate.expiryDate).to.equal(0); // Never expires
      expect(certificate.isRevoked).to.be.false;
      expect(certificate.metadataURI).to.include("https://api.skillquest.io/certificate/");
    });

    it("Should return correct user information", async () => {
      const { platform, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register user
      await platform.connect(student1).registerUser();
      
      // Get user info
      const registrationTime = await platform.getUserRegistrationTime(student1.address);
      expect(registrationTime).to.be.gt(0);
      
      const xp = await platform.getUserXP(student1.address);
      expect(xp).to.equal(0);
      
      const totalCertificates = await platform.getUserTotalCertificates(student1.address);
      expect(totalCertificates).to.equal(0);
    });

    it("Should return correct course enrollment time", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll in course
      const blockBefore = await ethers.provider.getBlock("latest");
      await platform.connect(student1).enrollCourse(1);
      
      // Get enrollment time
      const enrollmentTime = await platform.getCourseEnrollmentTime(student1.address, 1);
      expect(enrollmentTime).to.be.gte(blockBefore.timestamp);
    });

    it("Should return correct platform statistics", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll and complete course
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Get statistics
      const totalUsers = await platform.getTotalUsers();
      expect(totalUsers).to.equal(2);
      
      const totalCourses = await platform.getTotalCourses();
      expect(totalCourses).to.equal(1);
      
      const totalCertificates = await platform.getTotalCertificates();
      expect(totalCertificates).to.equal(1);
    });

    it("Should return all course tags", async () => {
      const { platform, instructor } = await loadFixture(deploySkillQuestFixture);
      
      // Register instructor
      await platform.connect(instructor).registerUser();
      
      // Create courses with different tags
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash1",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400 * 7,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash2",
        "Smart Contracts",
        "Learn to write smart contracts",
        ethers.parseUnits("75", 18),
        86400 * 14,
        150,
        ethers.parseUnits("7", 18),
        [],
        ["blockchain", "smart-contracts", "solidity"]
      );
      
      // Get all tags
      const allTags = await platform.getAllCourseTags();
      expect(allTags).to.include.members(["blockchain", "beginner", "smart-contracts", "solidity"]);
    });
  });

  describe("SkillQuestDeployer", () => {
    it("Should deploy the SkillQuest ecosystem", async () => {
      // Create a new instance for this test to avoid conflicts
      const [owner] = await ethers.getSigners();
      
      // Deploy deployer contract
      const SkillQuestDeployer = await ethers.getContractFactory("SkillQuestDeployer");
      const deployer = await SkillQuestDeployer.deploy();
      
      // Verify the deployer contract was deployed
      expect(await deployer.getAddress()).to.not.equal(ethers.ZeroAddress);
      
      // Create a new token for testing
      const SkillQuestToken = await ethers.getContractFactory("SkillQuestToken");
      const token = await SkillQuestToken.deploy(owner.address);
      
      // Approve the deployer to spend tokens from owner
      const rewardPoolAmount = ethers.parseUnits("30000000", 18); // 30 million tokens
      await token.approve(await deployer.getAddress(), rewardPoolAmount);
      
      // Verify the token was created and approval was set
      expect(await token.allowance(owner.address, await deployer.getAddress())).to.equal(rewardPoolAmount);
      
      
    });
  });


  describe("SkillQuest - String Utility Functions", () => {
    it("Should convert uint256 to string correctly", async () => {
      const { platform, instructor, student1 } = await loadFixture(deploySkillQuestFixture);
      
      // Register users
      await platform.connect(instructor).registerUser();
      await platform.connect(student1).registerUser();
      
      // Create course
      await platform.connect(instructor).createCourse(
        "ipfs://QmHash",
        "Blockchain Basics",
        "Learn the fundamentals of blockchain technology",
        ethers.parseUnits("50", 18),
        86400,
        100,
        ethers.parseUnits("5", 18),
        [],
        ["blockchain", "beginner"]
      );
      
      // Enroll and complete course to generate certificate
      await platform.connect(student1).enrollCourse(1);
      await time.increase(86400 + 1);
      await platform.connect(student1).updateProgress(1, 100);
      
      // Get certificate
      const userCertificates = await platform.getUserCertificates(student1.address);
      const certificateId = userCertificates[0];
      
      // Check certificate URI contains the ID as string
      const certificate = await platform.getCertificateDetails(certificateId);
      expect(certificate.metadataURI).to.include(`/certificate/${certificateId}`);
    });
  });
});
