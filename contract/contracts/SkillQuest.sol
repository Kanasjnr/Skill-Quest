// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SkillQuestToken
 * @dev The ERC20 token for the SkillQuest platform
 */
contract SkillQuestToken is ERC20, Ownable {
    constructor(address initialOwner) 
        ERC20("LEARN Token", "LEARN")
        Ownable(initialOwner)
    {
        // Mint initial supply for reward pool and platform operations
        _mint(initialOwner, 100000000 * 10**18); // 100 million tokens
    }
}

/**
 * @title SkillQuest
 * @dev A decentralized learning platform with integrated token rewards and NFT certifications
 */
contract SkillQuest is ERC1155, Ownable, ReentrancyGuard, Pausable {
    // Token contract
    SkillQuestToken public learnToken;
    
    // Counters (using simple uint256 instead of Counters library)
    uint256 private _nextCourseId = 1;
    uint256 private _nextCertificateId = 1;
    uint256 private _totalUsers = 0;
    
    // Constants
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 5% platform fee
    uint256 public constant REWARD_POOL_ALLOCATION = 30; // 30% of tokens allocated to rewards
    uint256 public constant MIN_ENROLLMENT_DURATION = 1 days; // Minimum time before completion
    
    // Structs
    struct Course {
        uint256 id;
        address instructor;
        string metadataURI; // IPFS URI containing course details
        string title;
        string description;
        uint256 price;
        uint256 duration; // in seconds
        uint256 xpReward;
        uint256 tokenReward;
        bool isActive;
        bool isPaused;
        uint256 enrollmentCount;
        uint256 completionCount;
        uint256 creationTime;
        uint256[] requiredCourses; // Prerequisites
        string[] tags; // Course tags/categories
    }
    
    struct User {
        bool isRegistered;
        uint256 userId;
        uint256 xp;
        uint256 totalCertificates;
        uint256 registrationTime;
        uint256[] enrolledCourses;
        uint256[] completedCourses;
        uint256[] instructorCourses;
        mapping(uint256 => uint256) courseProgress; // courseId => progress percentage (0-100)
        mapping(uint256 => uint256) courseStartTime; // courseId => enrollment timestamp
    }
    
    struct Certificate {
        uint256 id;
        uint256 courseId;
        address recipient;
        uint256 issueDate;
        uint256 expiryDate; // 0 means never expires
        string metadataURI; // IPFS URI containing certificate details
        bool isRevoked;
    }
    
    // Mappings
    mapping(uint256 => Course) public courses;
    mapping(address => User) public users;
    mapping(uint256 => Certificate) public certificates;
    mapping(uint256 => mapping(address => bool)) public courseEnrollments;
    mapping(uint256 => mapping(address => bool)) public certificateIssued;
    mapping(address => uint256[]) private userCertificates;
    mapping(string => bool) private courseTagExists;
    string[] public allCourseTags;
    address[] public registeredUsers;
    
    // Events
    event UserRegistered(address indexed user, uint256 userId);
    event CourseCreated(uint256 indexed courseId, address indexed instructor, string title, uint256 price);
    event CourseUpdated(uint256 indexed courseId, address indexed instructor);
    event CourseEnrolled(uint256 indexed courseId, address indexed user);
    event ProgressUpdated(uint256 indexed courseId, address indexed user, uint256 progress);
    event CourseCompleted(uint256 indexed courseId, address indexed user);
    event CertificateIssued(uint256 indexed certificateId, uint256 indexed courseId, address indexed recipient);
    event CertificateRevoked(uint256 indexed certificateId, address indexed recipient);
    event RewardDistributed(address indexed user, uint256 amount, string reason);
    event CoursePaused(uint256 indexed courseId, bool isPaused);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);
    event RewardPoolReplenished(address indexed from, uint256 amount);
    
    /**
     * @dev Constructor initializes the ERC1155 NFT and sets the token contract
     * @param tokenAddress Address of the LEARN token contract
     */
    constructor(address tokenAddress) 
        ERC1155("https://api.skillquest.io/metadata/{id}") 
        Ownable(msg.sender)
    {
        learnToken = SkillQuestToken(tokenAddress);
    }
    
    /**
     * @dev Set a new token contract address (only owner)
     * @param tokenAddress New token contract address
     */
    function setTokenContract(address tokenAddress) external onlyOwner {
        learnToken = SkillQuestToken(tokenAddress);
    }
    
    /**
     * @dev Register a new user
     */
    function registerUser() external whenNotPaused {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        _totalUsers++;
        uint256 userId = _totalUsers;
        
        User storage newUser = users[msg.sender];
        newUser.isRegistered = true;
        newUser.userId = userId;
        newUser.xp = 0;
        newUser.totalCertificates = 0;
        newUser.registrationTime = block.timestamp;
        
        registeredUsers.push(msg.sender);
        
        // Welcome bonus
        uint256 welcomeBonus = 10 * 10**18; // 10 tokens
        if (learnToken.balanceOf(address(this)) >= welcomeBonus) {
            learnToken.transfer(msg.sender, welcomeBonus);
            emit RewardDistributed(msg.sender, welcomeBonus, "Welcome bonus");
        }
        
        emit UserRegistered(msg.sender, userId);
    }
    
    /**
     * @dev Create a new course
     * @param metadataURI IPFS URI containing course details
     * @param title Course title
     * @param description Course description
     * @param price Course price in LEARN tokens
     * @param duration Course duration in seconds
     * @param xpReward XP points awarded upon completion
     * @param tokenReward Token amount awarded upon completion
     * @param requiredCourses Array of prerequisite course IDs
     * @param tags Array of course tags/categories
     * @return courseId The ID of the created course
     */
    function createCourse(
        string memory metadataURI,
        string memory title,
        string memory description,
        uint256 price,
        uint256 duration,
        uint256 xpReward,
        uint256 tokenReward,
        uint256[] memory requiredCourses,
        string[] memory tags
    ) external whenNotPaused returns (uint256 courseId) {
        require(users[msg.sender].isRegistered, "User not registered");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(duration >= MIN_ENROLLMENT_DURATION, "Duration too short");
        
        courseId = _nextCourseId++;
        
        Course storage newCourse = courses[courseId];
        newCourse.id = courseId;
        newCourse.instructor = msg.sender;
        newCourse.metadataURI = metadataURI;
        newCourse.title = title;
        newCourse.description = description;
        newCourse.price = price;
        newCourse.duration = duration;
        newCourse.xpReward = xpReward;
        newCourse.tokenReward = tokenReward;
        newCourse.isActive = true;
        newCourse.isPaused = false;
        newCourse.enrollmentCount = 0;
        newCourse.completionCount = 0;
        newCourse.creationTime = block.timestamp;
        newCourse.requiredCourses = requiredCourses;
        newCourse.tags = tags;
        
        // Add course to instructor's list
        users[msg.sender].instructorCourses.push(courseId);
        
        // Register new tags
        _registerCourseTags(tags);
        
        emit CourseCreated(courseId, msg.sender, title, price);
        return courseId;
    }
    
    /**
     * @dev Register course tags
     * @param tags Array of course tags
     */
    function _registerCourseTags(string[] memory tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            if (!courseTagExists[tags[i]]) {
                courseTagExists[tags[i]] = true;
                allCourseTags.push(tags[i]);
            }
        }
    }
    
    /**
     * @dev Check if a user has completed a prerequisite course
     * @param user Address of the user
     * @param requiredCourseId ID of the required course
     * @return completed Whether the user has completed the course
     */
    function _hasCompletedCourse(address user, uint256 requiredCourseId) internal view returns (bool completed) {
        for (uint256 j = 0; j < users[user].completedCourses.length; j++) {
            if (users[user].completedCourses[j] == requiredCourseId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Check if a user has completed all prerequisites for a course
     * @param user Address of the user
     * @param courseId ID of the course
     * @return completed Whether the user has completed all prerequisites
     */
    function _hasCompletedPrerequisites(address user, uint256 courseId) internal view returns (bool completed) {
        Course storage course = courses[courseId];
        
        for (uint256 i = 0; i < course.requiredCourses.length; i++) {
            if (!_hasCompletedCourse(user, course.requiredCourses[i])) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Process a single course enrollment
     * @param user Address of the user
     * @param courseId ID of the course
     */
    function _processSingleEnrollment(address user, uint256 courseId) internal {
        Course storage course = courses[courseId];
        
        // Handle payment
        if (course.price > 0) {
            // Calculate platform fee
            uint256 platformFee = (course.price * PLATFORM_FEE_PERCENT) / 100;
            uint256 instructorPayment = course.price - platformFee;
            
            // Transfer tokens
            require(learnToken.transferFrom(user, course.instructor, instructorPayment), "Token transfer failed");
            require(learnToken.transferFrom(user, address(this), platformFee), "Token transfer failed");
        }
        
        // Update enrollment data
        courseEnrollments[courseId][user] = true;
        users[user].enrolledCourses.push(courseId);
        users[user].courseStartTime[courseId] = block.timestamp;
        users[user].courseProgress[courseId] = 0;
        course.enrollmentCount++;
        
        emit CourseEnrolled(courseId, user);
    }
    
    /**
     * @dev Enroll in a course
     * @param courseId ID of the course to enroll in
     */
    function enrollCourse(uint256 courseId) external nonReentrant whenNotPaused {
        require(users[msg.sender].isRegistered, "User not registered");
        require(courses[courseId].isActive, "Course not active");
        require(!courses[courseId].isPaused, "Course is paused");
        require(!courseEnrollments[courseId][msg.sender], "Already enrolled");
        require(_hasCompletedPrerequisites(msg.sender, courseId), "Prerequisites not completed");
        
        // Check if user has enough balance
        require(learnToken.balanceOf(msg.sender) >= courses[courseId].price, "Insufficient balance");
        
        // Process enrollment
        _processSingleEnrollment(msg.sender, courseId);
    }
    
    /**
     * @dev Batch enroll in multiple courses
     * @param courseIds Array of course IDs to enroll in
     */
    function batchEnrollCourses(uint256[] memory courseIds) external nonReentrant whenNotPaused {
        require(users[msg.sender].isRegistered, "User not registered");
        
        uint256 totalPrice = 0;
        
        // Calculate total price and validate courses
        for (uint256 i = 0; i < courseIds.length; i++) {
            uint256 courseId = courseIds[i];
            require(courses[courseId].isActive, "Course not active");
            require(!courses[courseId].isPaused, "Course is paused");
            require(!courseEnrollments[courseId][msg.sender], "Already enrolled in a course");
            require(_hasCompletedPrerequisites(msg.sender, courseId), "Prerequisites not completed");
            
            totalPrice += courses[courseId].price;
        }
        
        // Check if user has enough balance
        require(learnToken.balanceOf(msg.sender) >= totalPrice, "Insufficient balance");
        
        // Process each enrollment
        for (uint256 i = 0; i < courseIds.length; i++) {
            _processSingleEnrollment(msg.sender, courseIds[i]);
        }
    }
    
    /**
     * @dev Update learning progress for a course
     * @param courseId ID of the course
     * @param progress Progress percentage (0-100)
     */
    function updateProgress(uint256 courseId, uint256 progress) external whenNotPaused {
        require(courseEnrollments[courseId][msg.sender], "Not enrolled in course");
        require(progress <= 100, "Progress cannot exceed 100%");
        require(progress >= users[msg.sender].courseProgress[courseId], "Cannot decrease progress");
        require(!courses[courseId].isPaused, "Course is paused");
        
        users[msg.sender].courseProgress[courseId] = progress;
        
        emit ProgressUpdated(courseId, msg.sender, progress);
        
        // Check if course is completed
        if (progress == 100) {
            _completeCourse(courseId);
        }
    }
    
    /**
     * @dev Internal function to handle course completion
     * @param courseId ID of the completed course
     */
    function _completeCourse(uint256 courseId) internal {
        require(courseEnrollments[courseId][msg.sender], "Not enrolled in course");
        require(users[msg.sender].courseProgress[courseId] == 100, "Course not completed");
        require(!certificateIssued[courseId][msg.sender], "Certificate already issued");
        
        Course storage course = courses[courseId];
        
        // Verify minimum time spent
        require(
            block.timestamp >= users[msg.sender].courseStartTime[courseId] + MIN_ENROLLMENT_DURATION,
            "Minimum enrollment duration not met"
        );
        
        // Add to completed courses
        users[msg.sender].completedCourses.push(courseId);
        course.completionCount++;
        
        // Award XP
        users[msg.sender].xp += course.xpReward;
        
        // Award tokens
        if (course.tokenReward > 0) {
            require(learnToken.balanceOf(address(this)) >= course.tokenReward, "Insufficient reward pool");
            learnToken.transfer(msg.sender, course.tokenReward);
            emit RewardDistributed(msg.sender, course.tokenReward, "Course completion");
        }
        
        // Issue certificate
        _issueCertificate(courseId, msg.sender);
        
        emit CourseCompleted(courseId, msg.sender);
    }
    
    /**
     * @dev Internal function to issue a certificate NFT
     * @param courseId ID of the completed course
     * @param recipient Address of the certificate recipient
     */
    function _issueCertificate(uint256 courseId, address recipient) internal {
        uint256 certificateId = _nextCertificateId++;
        
        // Create certificate metadata URI (in practice, this would be generated off-chain)
        string memory metadataURI = string(abi.encodePacked(
            "https://api.skillquest.io/certificate/",
            _toString(certificateId)
        ));
        
        // Store certificate data
        Certificate storage newCertificate = certificates[certificateId];
        newCertificate.id = certificateId;
        newCertificate.courseId = courseId;
        newCertificate.recipient = recipient;
        newCertificate.issueDate = block.timestamp;
        newCertificate.expiryDate = 0; // Never expires by default
        newCertificate.metadataURI = metadataURI;
        newCertificate.isRevoked = false;
        
        // Mint NFT certificate
        _mint(recipient, certificateId, 1, "");
        
        certificateIssued[courseId][recipient] = true;
        userCertificates[recipient].push(certificateId);
        users[recipient].totalCertificates++;
        
        emit CertificateIssued(certificateId, courseId, recipient);
    }
    
    /**
     * @dev Revoke a certificate (only owner or course instructor)
     * @param certificateId ID of the certificate to revoke
     */
    function revokeCertificate(uint256 certificateId) external {
        Certificate storage cert = certificates[certificateId];
        Course storage course = courses[cert.courseId];
        
        require(
            msg.sender == owner() || msg.sender == course.instructor,
            "Not authorized"
        );
        require(!cert.isRevoked, "Certificate already revoked");
        
        cert.isRevoked = true;
        
        // Burn the NFT
        _burn(cert.recipient, certificateId, 1);
        
        emit CertificateRevoked(certificateId, cert.recipient);
    }
    
    /**
     * @dev Get enrolled courses for a user
     * @param user Address of the user
     * @return enrolledCourses Array of course IDs
     */
    function getEnrolledCourses(address user) external view returns (uint256[] memory enrolledCourses) {
        return users[user].enrolledCourses;
    }
    
    /**
     * @dev Get completed courses for a user
     * @param user Address of the user
     * @return completedCourses Array of course IDs
     */
    function getCompletedCourses(address user) external view returns (uint256[] memory completedCourses) {
        return users[user].completedCourses;
    }
    
    /**
     * @dev Get courses created by an instructor
     * @param instructor Address of the instructor
     * @return instructorCourses Array of course IDs
     */
    function getInstructorCourses(address instructor) external view returns (uint256[] memory instructorCourses) {
        return users[instructor].instructorCourses;
    }
    
    /**
     * @dev Get certificates owned by a user
     * @param user Address of the user
     * @return userCerts Array of certificate IDs
     */
    function getUserCertificates(address user) external view returns (uint256[] memory userCerts) {
        return userCertificates[user];
    }
    
    /**
     * @dev Get course progress for a user
     * @param user Address of the user
     * @param courseId ID of the course
     * @return progress Progress percentage (0-100)
     */
    function getCourseProgress(address user, uint256 courseId) external view returns (uint256 progress) {
        return users[user].courseProgress[courseId];
    }
    
    /**
     * @dev Get course enrollment time for a user
     * @param user Address of the user
     * @param courseId ID of the course
     * @return enrollmentTime Enrollment timestamp
     */
    function getCourseEnrollmentTime(address user, uint256 courseId) external view returns (uint256 enrollmentTime) {
        return users[user].courseStartTime[courseId];
    }
    
    /**
     * @dev Get user XP
     * @param user Address of the user
     * @return xp XP points
     */
    function getUserXP(address user) external view returns (uint256 xp) {
        return users[user].xp;
    }
    
    /**
     * @dev Get user registration time
     * @param user Address of the user
     * @return registrationTime Registration timestamp
     */
    function getUserRegistrationTime(address user) external view returns (uint256 registrationTime) {
        return users[user].registrationTime;
    }
    
    /**
     * @dev Get total number of certificates owned by a user
     * @param user Address of the user
     * @return totalCertificates Number of certificates
     */
    function getUserTotalCertificates(address user) external view returns (uint256 totalCertificates) {
        return users[user].totalCertificates;
    }
    
    /**
     * @dev Get basic course information
     * @param courseId ID of the course
     * @return title Course title
     * @return instructor Course instructor address
     * @return price Course price
     * @return isActive Whether the course is active
     */
    function getCourseBasicInfo(uint256 courseId) external view returns (
        string memory title,
        address instructor,
        uint256 price,
        bool isActive
    ) {
        Course storage course = courses[courseId];
        return (
            course.title,
            course.instructor,
            course.price,
            course.isActive
        );
    }
    
    /**
     * @dev Get detailed course information (part 1)
     * @param courseId ID of the course
     * @return id Course ID
     * @return instructor Course instructor address
     * @return title Course title
     * @return description Course description
     * @return metadataURI Course metadata URI
     * @return price Course price
     * @return duration Course duration
     */
    function getCourseDetails1(uint256 courseId) external view returns (
        uint256 id,
        address instructor,
        string memory title,
        string memory description,
        string memory metadataURI,
        uint256 price,
        uint256 duration
    ) {
        Course storage course = courses[courseId];
        return (
            course.id,
            course.instructor,
            course.title,
            course.description,
            course.metadataURI,
            course.price,
            course.duration
        );
    }
    
    /**
     * @dev Get detailed course information (part 2)
     * @param courseId ID of the course
     * @return xpReward XP reward
     * @return tokenReward Token reward
     * @return isActive Active status
     * @return isPaused Paused status
     * @return enrollmentCount Number of enrollments
     * @return completionCount Number of completions
     * @return creationTime Course creation time
     */
    function getCourseDetails2(uint256 courseId) external view returns (
        uint256 xpReward,
        uint256 tokenReward,
        bool isActive,
        bool isPaused,
        uint256 enrollmentCount,
        uint256 completionCount,
        uint256 creationTime
    ) {
        Course storage course = courses[courseId];
        return (
            course.xpReward,
            course.tokenReward,
            course.isActive,
            course.isPaused,
            course.enrollmentCount,
            course.completionCount,
            course.creationTime
        );
    }
    
    /**
     * @dev Get course prerequisites
     * @param courseId ID of the course
     * @return prerequisites Array of prerequisite course IDs
     */
    function getCoursePrerequisites(uint256 courseId) external view returns (uint256[] memory prerequisites) {
        return courses[courseId].requiredCourses;
    }
    
    /**
     * @dev Get course tags
     * @param courseId ID of the course
     * @return tags Array of course tags
     */
    function getCourseTags(uint256 courseId) external view returns (string[] memory tags) {
        return courses[courseId].tags;
    }
    
    /**
     * @dev Get certificate details
     * @param certificateId ID of the certificate
     * @return id Certificate ID
     * @return courseId Course ID
     * @return recipient Certificate recipient
     * @return issueDate Certificate issue date
     * @return expiryDate Certificate expiry date
     * @return metadataURI Certificate metadata URI
     * @return isRevoked Revocation status
     */
    function getCertificateDetails(uint256 certificateId) external view returns (
        uint256 id,
        uint256 courseId,
        address recipient,
        uint256 issueDate,
        uint256 expiryDate,
        string memory metadataURI,
        bool isRevoked
    ) {
        Certificate storage cert = certificates[certificateId];
        return (
            cert.id,
            cert.courseId,
            cert.recipient,
            cert.issueDate,
            cert.expiryDate,
            cert.metadataURI,
            cert.isRevoked
        );
    }
    
    /**
     * @dev Get total number of courses
     * @return totalCourses Total number of courses
     */
    function getTotalCourses() external view returns (uint256 totalCourses) {
        return _nextCourseId - 1;
    }
    
    /**
     * @dev Get total number of certificates
     * @return totalCertificates Total number of certificates
     */
    function getTotalCertificates() external view returns (uint256 totalCertificates) {
        return _nextCertificateId - 1;
    }
    
    /**
     * @dev Get total number of registered users
     * @return totalUsers Total number of users
     */
    function getTotalUsers() external view returns (uint256 totalUsers) {
        return _totalUsers;
    }
    
    /**
     * @dev Get all course tags
     * @return tags Array of all course tags
     */
    function getAllCourseTags() external view returns (string[] memory tags) {
        return allCourseTags;
    }
    
    /**
     * @dev Update course details (only instructor or owner)
     * @param courseId ID of the course
     * @param metadataURI New IPFS URI containing course details
     * @param title New course title
     * @param description New course description
     * @param price New course price
     * @param isActive New active status
     */
    function updateCourse(
        uint256 courseId,
        string memory metadataURI,
        string memory title,
        string memory description,
        uint256 price,
        bool isActive
    ) external whenNotPaused {
        Course storage course = courses[courseId];
        require(msg.sender == course.instructor || msg.sender == owner(), "Not authorized");
        
        course.metadataURI = metadataURI;
        course.title = title;
        course.description = description;
        course.price = price;
        course.isActive = isActive;
        
        emit CourseUpdated(courseId, msg.sender);
    }
    
    /**
     * @dev Update course reward settings (only instructor or owner)
     * @param courseId ID of the course
     * @param xpReward New XP reward
     * @param tokenReward New token reward
     */
    function updateCourseRewards(
        uint256 courseId,
        uint256 xpReward,
        uint256 tokenReward
    ) external whenNotPaused {
        Course storage course = courses[courseId];
        require(msg.sender == course.instructor || msg.sender == owner(), "Not authorized");
        
        course.xpReward = xpReward;
        course.tokenReward = tokenReward;
        
        emit CourseUpdated(courseId, msg.sender);
    }
    
    /**
     * @dev Pause or unpause a course (only instructor or owner)
     * @param courseId ID of the course
     * @param isPaused New paused status
     */
    function pauseCourse(uint256 courseId, bool isPaused) external {
        Course storage course = courses[courseId];
        require(msg.sender == course.instructor || msg.sender == owner(), "Not authorized");
        
        course.isPaused = isPaused;
        
        emit CoursePaused(courseId, isPaused);
    }
    
    /**
     * @dev Withdraw platform fees (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawPlatformFees(uint256 amount) external onlyOwner {
        require(learnToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        learnToken.transfer(msg.sender, amount);
    }
    
    /**
     * @dev Top up reward pool (anyone can contribute)
     * @param amount Amount to contribute
     */
    function topUpRewardPool(uint256 amount) external whenNotPaused {
        require(learnToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(learnToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit RewardPoolReplenished(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw all tokens (only owner)
     * @param to Recipient address
     */
    function emergencyWithdraw(address to) external onlyOwner {
        uint256 balance = learnToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        learnToken.transfer(to, balance);
    }
    
    /**
     * @dev Pause all contract functions (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause all contract functions (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Convert uint256 to string (helper function)
     * @param value The uint256 value to convert
     * @return result The string representation
     */
    function _toString(uint256 value) internal pure returns (string memory result) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}

/**
 * @title SkillQuestDeployer
 * @dev Contract to deploy the SkillQuest ecosystem
 */
contract SkillQuestDeployer {
    SkillQuestToken public token;
    SkillQuest public platform;
    
    /**
     * @dev Deploy the SkillQuest ecosystem
     */
    function deploy() external {
        // Deploy token
        token = new SkillQuestToken(msg.sender);
        
        // Deploy platform
        platform = new SkillQuest(address(token));
        
        // Transfer tokens to platform for rewards
        uint256 rewardPoolAmount = 30000000 * 10**18; // 30 million tokens for rewards
        token.transferFrom(msg.sender, address(platform), rewardPoolAmount);
    }
}