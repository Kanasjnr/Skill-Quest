// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

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
    uint256 private _nextModuleId = 1;
    uint256 private _nextLessonId = 1;
    uint256 private _nextQuestionId = 1;
    uint256 private _nextQuizId = 1;
    uint256 private _nextAchievementId = 1;
    
    // Constants
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 5% platform fee
    uint256 public constant REWARD_POOL_ALLOCATION = 30; // 30% of tokens allocated to rewards
    uint256 public constant MIN_ENROLLMENT_DURATION = 1 days; // Minimum time before completion
    uint256 public constant QUIZ_PASS_THRESHOLD = 60; // 60% correct answers to pass
    uint256 public constant QUIZ_QUESTIONS_COUNT = 5; // Number of random questions per quiz
    uint256 public constant XP_PER_LEVEL = 1000; // XP needed to level up
    
    // Enums
    enum ContentType { TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT }
    enum AchievementTrigger { 
        COURSE_COUNT, 
        CERTIFICATE_COUNT, 
        XP_THRESHOLD, 
        STREAK_DAYS,
        PERFECT_QUIZ,
        INSTRUCTOR_STUDENTS,
        INSTRUCTOR_COURSES,
        INSTRUCTOR_RATING
    }
    
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
        uint256[] moduleIds; // Course modules
        uint256[] questionIds; // Question bank for quizzes
    }
    
    struct Module {
        uint256 id;
        uint256 courseId;
        string title;
        string description;
        uint256 orderIndex; // Position in the course
        uint256[] lessonIds; // Lessons in this module
        bool isActive;
    }
    
    struct Lesson {
        uint256 id;
        uint256 moduleId;
        string title;
        string description;
        ContentType contentType;
        string contentURI; // IPFS URI for content
        uint256 duration; // in seconds
        uint256 orderIndex; // Position in the module
        bool isActive;
    }
    
    struct Question {
        uint256 id;
        uint256 courseId;
        string questionText;
        string[] options; // Multiple choice options
        uint8 correctOptionIndex; // Index of correct answer
        uint256 difficulty; // 1-5 scale
        bool isActive;
    }
    
    struct Quiz {
        uint256 id;
        uint256 courseId;
        address student;
        uint256[] questionIds; // Selected questions
        uint8[] studentAnswers; // Student's answers
        uint256 score; // Percentage score
        bool passed;
        uint256 timestamp;
    }
    
    struct User {
        bool isRegistered;
        uint256 userId;
        string name;
        string bio;
        string profileImage; // IPFS URI for profile image
        uint256 xp;
        uint256 level;
        uint256 streak; // Consecutive days active
        uint256 lastActive; // Last activity timestamp
        uint256 totalCertificates;
        uint256 registrationTime;
        uint256[] enrolledCourses;
        uint256[] completedCourses;
        uint256[] earnedAchievements; // Achievement IDs
        mapping(uint256 => uint256) courseProgress; // courseId => progress percentage (0-100)
        mapping(uint256 => uint256) courseStartTime; // courseId => enrollment timestamp
        mapping(uint256 => uint256) lessonCompletions; // lessonId => completion timestamp
        mapping(uint256 => bool) completedLessons; // lessonId => completed
    }
    
    struct Instructor {
        bool isRegistered;
        uint256 instructorId;
        string name;
        string bio;
        string profileImage; // IPFS URI for profile image
        string expertise;
        uint256 totalCourses;
        uint256 totalStudents;
        uint256 earnings;
        uint256 registrationTime;
        uint256[] createdCourses;
        uint256 averageRating;
        uint256 totalReviews;
        uint256 level;
        uint256 xp;
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
    
    struct Review {
        uint256 id;
        address reviewer;
        address instructor;
        uint256 courseId;
        uint256 rating; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool isVerified; // Whether the reviewer completed the course
    }
    
    struct Achievement {
        uint256 id;
        string title;
        string description;
        string imageURI; // IPFS URI for achievement badge
        uint256 xpReward;
        uint256 tokenReward;
        AchievementTrigger triggerType;
        uint256 triggerValue; // Threshold value to trigger achievement
        bool isActive;
    }
    
    // Add new structs for batch course creation
    struct ModuleInput {
        string title;
        string description;
        uint256 orderIndex;
        LessonInput[] lessons;
    }

    struct LessonInput {
        string title;
        string description;
        ContentType contentType;
        string contentURI;
        uint256 duration;
        uint256 orderIndex;
    }

    struct QuestionInput {
        string questionText;
        string[] options;
        uint8 correctOptionIndex;
        uint256 difficulty;
    }

    struct CourseCreationInput {
        string metadataURI;
        string title;
        string description;
        uint256 price;
        uint256 duration;
        uint256 xpReward;
        uint256 tokenReward;
        uint256[] requiredCourses;
        string[] tags;
        ModuleInput[] modules;
        QuestionInput[] questions;
    }
    
    // Mappings
    mapping(uint256 => Course) public courses;
    mapping(address => User) public users;
    mapping(address => Instructor) public instructors;
    mapping(uint256 => Certificate) public certificates;
    mapping(uint256 => Module) public modules;
    mapping(uint256 => Lesson) public lessons;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => Quiz) public quizzes;
    mapping(uint256 => Achievement) public achievements;
    mapping(uint256 => mapping(address => bool)) public courseEnrollments;
    mapping(uint256 => mapping(address => bool)) public certificateIssued;
    mapping(uint256 => mapping(address => bool)) public quizCompleted;
    mapping(address => uint256[]) private userCertificates;
    mapping(string => bool) private courseTagExists;
    mapping(uint256 => Review) public reviews;
    mapping(address => mapping(uint256 => bool)) public userAchievements; // user => achievementId => earned
    mapping(address => mapping(address => bool)) public hasReviewed; // reviewer => instructor => hasReviewed
    mapping(address => uint256) public lastLoginTime; // Track user logins for streaks
    
    string[] public allCourseTags;
    address[] public registeredUsers;
    address[] public registeredInstructors;
    uint256 private _nextInstructorId = 1;
    uint256 private _nextReviewId = 1;
    
    // Events
    event UserRegistered(address indexed user, uint256 userId, string name);
    event InstructorRegistered(address indexed instructor, uint256 instructorId, string name);
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
    event ReviewSubmitted(uint256 indexed reviewId, address indexed instructor, address indexed reviewer, uint256 rating);
    event AchievementEarned(address indexed user, uint256 indexed achievementId, string title);
    event ModuleCreated(uint256 indexed moduleId, uint256 indexed courseId, string title);
    event LessonCreated(uint256 indexed lessonId, uint256 indexed moduleId, string title);
    event LessonCompleted(uint256 indexed lessonId, address indexed user);
    event QuestionCreated(uint256 indexed questionId, uint256 indexed courseId);
    event QuizStarted(uint256 indexed quizId, address indexed user, uint256 indexed courseId);
    event QuizCompleted(uint256 indexed quizId, address indexed user, uint256 score, bool passed);
    event UserLevelUp(address indexed user, uint256 newLevel);
    event StreakUpdated(address indexed user, uint256 streakDays);
    
    /**
     * @dev Constructor initializes the ERC1155 NFT and sets the token contract
     * @param tokenAddress Address of the LEARN token contract
     */
    constructor(address tokenAddress) 
        ERC1155("https://api.skillquest.io/metadata/{id}") 
        Ownable(msg.sender)
    {
        learnToken = SkillQuestToken(tokenAddress);
        
        // Initialize default achievements
        _initializeAchievements();
    }
    
    /**
     * @dev Initialize default achievements
     */
    function _initializeAchievements() internal {
        // Student achievements
        _createAchievement(
            "First Steps",
            "Complete your first course",
            "ipfs://achievements/first-steps.png",
            100,
            10 * 10**18,
            AchievementTrigger.COURSE_COUNT,
            1
        );
        
        _createAchievement(
            "Knowledge Seeker",
            "Complete 5 courses",
            "ipfs://achievements/knowledge-seeker.png",
            300,
            50 * 10**18,
            AchievementTrigger.COURSE_COUNT,
            5
        );
        
        _createAchievement(
            "Master Scholar",
            "Complete 20 courses",
            "ipfs://achievements/master-scholar.png",
            1000,
            200 * 10**18,
            AchievementTrigger.COURSE_COUNT,
            20
        );
        
        _createAchievement(
            "Perfect Quiz",
            "Score 100% on a quiz",
            "ipfs://achievements/perfect-quiz.png",
            200,
            20 * 10**18,
            AchievementTrigger.PERFECT_QUIZ,
            1
        );
        
        _createAchievement(
            "Consistent Learner",
            "Maintain a 7-day learning streak",
            "ipfs://achievements/consistent-learner.png",
            150,
            15 * 10**18,
            AchievementTrigger.STREAK_DAYS,
            7
        );
        
        _createAchievement(
            "Dedicated Learner",
            "Maintain a 30-day learning streak",
            "ipfs://achievements/dedicated-learner.png",
            500,
            50 * 10**18,
            AchievementTrigger.STREAK_DAYS,
            30
        );
        
        // Instructor achievements
        _createAchievement(
            "First Class",
            "Get your first student",
            "ipfs://achievements/first-class.png",
            100,
            10 * 10**18,
            AchievementTrigger.INSTRUCTOR_STUDENTS,
            1
        );
        
        _createAchievement(
            "Popular Teacher",
            "Reach 100 students",
            "ipfs://achievements/popular-teacher.png",
            500,
            50 * 10**18,
            AchievementTrigger.INSTRUCTOR_STUDENTS,
            100
        );
        
        _createAchievement(
            "Course Creator",
            "Create 5 courses",
            "ipfs://achievements/course-creator.png",
            300,
            30 * 10**18,
            AchievementTrigger.INSTRUCTOR_COURSES,
            5
        );
        
        _createAchievement(
            "Top Rated",
            "Achieve a 4.5+ rating with at least 10 reviews",
            "ipfs://achievements/top-rated.png",
            400,
            40 * 10**18,
            AchievementTrigger.INSTRUCTOR_RATING,
            45 // 4.5 * 10 for integer comparison
        );
    }
    
    /**
     * @dev Set a new token contract address (only owner)
     * @param tokenAddress New token contract address
     */
    function setTokenContract(address tokenAddress) external onlyOwner {
        learnToken = SkillQuestToken(tokenAddress);
    }
    
    /**
     * @dev Register a new user with enhanced profile
     * @param name User's name/username
     * @param bio User's bio
     * @param profileImage IPFS URI for profile image (optional)
     */
    function registerUser(
        string memory name,
        string memory bio,
        string memory profileImage
    ) external whenNotPaused {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        _totalUsers++;
        uint256 userId = _totalUsers;
        
        User storage newUser = users[msg.sender];
        newUser.isRegistered = true;
        newUser.userId = userId;
        newUser.name = name;
        newUser.bio = bio;
        newUser.profileImage = bytes(profileImage).length > 0 ? profileImage : "";
        newUser.xp = 0;
        newUser.level = 1;
        newUser.streak = 0;
        newUser.lastActive = block.timestamp;
        newUser.totalCertificates = 0;
        newUser.registrationTime = block.timestamp;
        
        registeredUsers.push(msg.sender);
        lastLoginTime[msg.sender] = block.timestamp;
        
        // Welcome bonus
        uint256 welcomeBonus = 100 * 10**18; // 100 tokens
        if (learnToken.balanceOf(address(this)) >= welcomeBonus) {
            learnToken.transfer(msg.sender, welcomeBonus);
            emit RewardDistributed(msg.sender, welcomeBonus, "Welcome bonus");
        }
        
        emit UserRegistered(msg.sender, userId, name);
    }
    
    /**
     * @dev Register a new instructor with enhanced profile
     * @param name Instructor's name
     * @param bio Instructor's bio
     * @param profileImage IPFS URI for profile image (optional)
     * @param expertise Instructor's expertise
     */
    function registerInstructor(
        string memory name,
        string memory bio,
        string memory profileImage,
        string memory expertise
    ) external whenNotPaused {
        require(!instructors[msg.sender].isRegistered, "Instructor already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        uint256 instructorId = _nextInstructorId++;
        
        Instructor storage newInstructor = instructors[msg.sender];
        newInstructor.isRegistered = true;
        newInstructor.instructorId = instructorId;
        newInstructor.name = name;
        newInstructor.bio = bio;
        newInstructor.profileImage = bytes(profileImage).length > 0 ? profileImage : "";
        newInstructor.expertise = expertise;
        newInstructor.totalCourses = 0;
        newInstructor.totalStudents = 0;
        newInstructor.earnings = 0;
        newInstructor.registrationTime = block.timestamp;
        newInstructor.averageRating = 0;
        newInstructor.totalReviews = 0;
        newInstructor.level = 1;
        newInstructor.xp = 0;
        
        registeredInstructors.push(msg.sender);
        lastLoginTime[msg.sender] = block.timestamp;
        
        emit InstructorRegistered(msg.sender, instructorId, name);
    }
    
    /**
     * @dev User login function to update streaks
     */
    function login() external {
        require(users[msg.sender].isRegistered || instructors[msg.sender].isRegistered, "Not registered");
        
        uint256 lastLogin = lastLoginTime[msg.sender];
        uint256 currentTime = block.timestamp;
        uint256 oneDaySeconds = 1 days;
        
        // If last login was more than 1 day but less than 2 days ago, increment streak
        if (currentTime - lastLogin >= oneDaySeconds && currentTime - lastLogin < 2 * oneDaySeconds) {
            users[msg.sender].streak++;
            emit StreakUpdated(msg.sender, users[msg.sender].streak);
            
            // Check streak achievements
            _checkAndAwardAchievements(msg.sender);
        } 
        // If last login was more than 2 days ago, reset streak
        else if (currentTime - lastLogin >= 2 * oneDaySeconds) {
            users[msg.sender].streak = 1;
            emit StreakUpdated(msg.sender, users[msg.sender].streak);
        }
        
        lastLoginTime[msg.sender] = currentTime;
        users[msg.sender].lastActive = currentTime;
    }
    
    /**
     * @dev Get instructor profile
     * @param instructor Address of the instructor
     * @return name Instructor's name
     * @return bio Instructor's bio
     * @return expertise Instructor's expertise
     * @return totalCourses Total courses created
     * @return totalStudents Total students enrolled
     * @return earnings Total earnings
     * @return level Instructor level
     */
    function getInstructorProfile(address instructor) external view returns (
        string memory name,
        string memory bio,
        string memory expertise,
        uint256 totalCourses,
        uint256 totalStudents,
        uint256 earnings,
        uint256 level
    ) {
        Instructor storage instructorData = instructors[instructor];
        return (
            instructorData.name,
            instructorData.bio,
            instructorData.expertise,
            instructorData.totalCourses,
            instructorData.totalStudents,
            instructorData.earnings,
            instructorData.level
        );
    }
    
    /**
     * @dev Get user profile
     * @param user Address of the user
     * @return name User's name
     * @return bio User's bio
     * @return xp User's XP
     * @return level User's level
     * @return streak User's current streak
     * @return totalCertificates Total certificates earned
     */
    function getUserProfile(address user) external view returns (
        string memory name,
        string memory bio,
        uint256 xp,
        uint256 level,
        uint256 streak,
        uint256 totalCertificates
    ) {
        User storage userData = users[user];
        return (
            userData.name,
            userData.bio,
            userData.xp,
            userData.level,
            userData.streak,
            userData.totalCertificates
        );
    }
    
    /**
     * @dev Create a complete course with all modules, lessons and questions in one transaction
     * @param input Complete course creation input
     * @return courseId The ID of the created course
     */
    function createCompleteCourse(CourseCreationInput calldata input) external whenNotPaused returns (uint256 courseId) {
        require(instructors[msg.sender].isRegistered, "Not registered as instructor");
        require(bytes(input.title).length > 0, "Title cannot be empty");
        require(bytes(input.description).length > 0, "Description cannot be empty");
        require(input.duration >= MIN_ENROLLMENT_DURATION, "Duration too short");
        
        // Create the course
        courseId = _nextCourseId++;
        
        Course storage newCourse = courses[courseId];
        newCourse.id = courseId;
        newCourse.instructor = msg.sender;
        newCourse.metadataURI = input.metadataURI;
        newCourse.title = input.title;
        newCourse.description = input.description;
        newCourse.price = input.price;
        newCourse.duration = input.duration;
        newCourse.xpReward = input.xpReward;
        newCourse.tokenReward = input.tokenReward;
        newCourse.isActive = true;
        newCourse.isPaused = false;
        newCourse.enrollmentCount = 0;
        newCourse.completionCount = 0;
        newCourse.creationTime = block.timestamp;
        newCourse.requiredCourses = input.requiredCourses;
        newCourse.tags = input.tags;

        // Create modules and lessons
        for (uint256 i = 0; i < input.modules.length; i++) {
            ModuleInput calldata moduleInput = input.modules[i];
            
            // Create module
            uint256 moduleId = _nextModuleId++;
            Module storage newModule = modules[moduleId];
            newModule.id = moduleId;
            newModule.courseId = courseId;
            newModule.title = moduleInput.title;
            newModule.description = moduleInput.description;
            newModule.orderIndex = moduleInput.orderIndex;
            newModule.isActive = true;
            
            newCourse.moduleIds.push(moduleId);
            
            // Create lessons for this module
            for (uint256 j = 0; j < moduleInput.lessons.length; j++) {
                LessonInput calldata lessonInput = moduleInput.lessons[j];
                
                uint256 lessonId = _nextLessonId++;
                Lesson storage newLesson = lessons[lessonId];
                newLesson.id = lessonId;
                newLesson.moduleId = moduleId;
                newLesson.title = lessonInput.title;
                newLesson.description = lessonInput.description;
                newLesson.contentType = lessonInput.contentType;
                newLesson.contentURI = lessonInput.contentURI;
                newLesson.duration = lessonInput.duration;
                newLesson.orderIndex = lessonInput.orderIndex;
                newLesson.isActive = true;
                
                newModule.lessonIds.push(lessonId);
            }
        }

        // Create questions
        for (uint256 i = 0; i < input.questions.length; i++) {
            QuestionInput calldata questionInput = input.questions[i];
            
            uint256 questionId = _nextQuestionId++;
            Question storage newQuestion = questions[questionId];
            newQuestion.id = questionId;
            newQuestion.courseId = courseId;
            newQuestion.questionText = questionInput.questionText;
            newQuestion.options = questionInput.options;
            newQuestion.correctOptionIndex = questionInput.correctOptionIndex;
            newQuestion.difficulty = questionInput.difficulty;
            newQuestion.isActive = true;
            
            newCourse.questionIds.push(questionId);
        }
        
        // Update instructor stats
        instructors[msg.sender].totalCourses++;
        instructors[msg.sender].createdCourses.push(courseId);
        
        // Award XP to instructor
        _awardInstructorXP(msg.sender, 100); // 100 XP for creating a course
        
        // Register new tags
        _registerCourseTags(input.tags);
        
        // Check instructor achievements
        _checkInstructorAchievements(msg.sender);
        
        emit CourseCreated(courseId, msg.sender, input.title, input.price);
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
            
            // Update instructor earnings
            instructors[course.instructor].earnings += instructorPayment;
            instructors[course.instructor].totalStudents++;
            
            // Check instructor achievements
            _checkInstructorAchievements(course.instructor);
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
     * @dev Complete a lesson
     * @param lessonId ID of the lesson
     */
    function completeLesson(uint256 lessonId) external whenNotPaused {
        Lesson storage lesson = lessons[lessonId];
        Module storage module = modules[lesson.moduleId];
        Course storage course = courses[module.courseId];
        
        require(courseEnrollments[course.id][msg.sender], "Not enrolled in course");
        require(!courses[course.id].isPaused, "Course is paused");
        require(!users[msg.sender].completedLessons[lessonId], "Lesson already completed");
        
        // Mark lesson as completed
        users[msg.sender].completedLessons[lessonId] = true;
        users[msg.sender].lessonCompletions[lessonId] = block.timestamp;
        
        // Award XP for completing a lesson
        _awardUserXP(msg.sender, 10); // 10 XP per lesson
        
        // Update course progress
        _updateCourseProgress(msg.sender, course.id);
        
        emit LessonCompleted(lessonId, msg.sender);
    }
    
    /**
     * @dev Update course progress based on completed lessons
     * @param user Address of the user
     * @param courseId ID of the course
     */
    function _updateCourseProgress(address user, uint256 courseId) internal {
        Course storage course = courses[courseId];
        uint256 totalLessons = 0;
        uint256 completedLessons = 0;
        
        // Count total and completed lessons
        for (uint256 i = 0; i < course.moduleIds.length; i++) {
            Module storage module = modules[course.moduleIds[i]];
            for (uint256 j = 0; j < module.lessonIds.length; j++) {
                totalLessons++;
                if (users[user].completedLessons[module.lessonIds[j]]) {
                    completedLessons++;
                }
            }
        }
        
        // Calculate progress percentage
        uint256 progress = totalLessons > 0 ? (completedLessons * 100) / totalLessons : 0;
        users[user].courseProgress[courseId] = progress;
        
        emit ProgressUpdated(courseId, user, progress);
        
        // Check if all lessons are completed
        if (progress == 100) {
            // Generate quiz if not already taken
            if (!quizCompleted[courseId][user]) {
                _generateQuiz(user, courseId);
            }
        }
    }
    
    /**
     * @dev Generate a random quiz for a course
     * @param user Address of the user
     * @param courseId ID of the course
     * @return quizId The ID of the generated quiz
     */
    function _generateQuiz(address user, uint256 courseId) internal returns (uint256 quizId) {
        Course storage course = courses[courseId];
        require(course.questionIds.length >= QUIZ_QUESTIONS_COUNT, "Not enough questions in bank");
        
        quizId = _nextQuizId++;
        
        // Select random questions
        uint256[] memory selectedQuestions = new uint256[](QUIZ_QUESTIONS_COUNT);
        uint256[] memory questionPool = course.questionIds;
        
        // Fisher-Yates shuffle to select random questions
        for (uint256 i = 0; i < QUIZ_QUESTIONS_COUNT; i++) {
            uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, user, i))) % (questionPool.length - i);
            selectedQuestions[i] = questionPool[randomIndex];
            
            // Swap to ensure we don't pick the same question twice
            questionPool[randomIndex] = questionPool[questionPool.length - i - 1];
        }
        
        // Create the quiz
        Quiz storage newQuiz = quizzes[quizId];
        newQuiz.id = quizId;
        newQuiz.courseId = courseId;
        newQuiz.student = user;
        newQuiz.questionIds = selectedQuestions;
        newQuiz.timestamp = block.timestamp;
        
        emit QuizStarted(quizId, user, courseId);
        return quizId;
    }
    
    /**
     * @dev Get current quiz for a course
     * @param courseId ID of the course
     * @return quizId The ID of the current quiz
     * @return questionIds Array of question IDs in the quiz
     */
    function getCurrentQuiz(uint256 courseId) external view returns (uint256 quizId, uint256[] memory questionIds) {
        // Find the most recent quiz for this user and course
        uint256 latestQuizId = 0;
        uint256 latestTimestamp = 0;
        
        for (uint256 i = 1; i < _nextQuizId; i++) {
            Quiz storage quiz = quizzes[i];
            if (quiz.courseId == courseId && quiz.student == msg.sender && !quiz.passed && quiz.timestamp > latestTimestamp) {
                latestQuizId = i;
                latestTimestamp = quiz.timestamp;
            }
        }
        
        require(latestQuizId > 0, "No active quiz found");
        
        return (latestQuizId, quizzes[latestQuizId].questionIds);
    }
    
    /**
     * @dev Get question details
     * @param questionId ID of the question
     * @return questionText The question text
     * @return options Array of answer options
     */
    function getQuestionDetails(uint256 questionId) external view returns (string memory questionText, string[] memory options) {
        Question storage question = questions[questionId];
        return (question.questionText, question.options);
    }
    
    /**
     * @dev Submit quiz answers
     * @param quizId ID of the quiz
     * @param answers Array of answer indices
     */
    function submitQuizAnswers(uint256 quizId, uint8[] memory answers) external whenNotPaused {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.student == msg.sender, "Not your quiz");
        require(quiz.questionIds.length == answers.length, "Answer count mismatch");
        require(quiz.studentAnswers.length == 0, "Quiz already submitted");
        
        // Store answers
        quiz.studentAnswers = answers;
        
        // Calculate score
        uint256 correctAnswers = 0;
        for (uint256 i = 0; i < quiz.questionIds.length; i++) {
            Question storage question = questions[quiz.questionIds[i]];
            if (answers[i] == question.correctOptionIndex) {
                correctAnswers++;
            }
        }
        
        uint256 score = (correctAnswers * 100) / quiz.questionIds.length;
        quiz.score = score;
        quiz.passed = score >= QUIZ_PASS_THRESHOLD;
        
        emit QuizCompleted(quizId, msg.sender, score, quiz.passed);
        
        // If passed, complete the course
        if (quiz.passed) {
            quizCompleted[quiz.courseId][msg.sender] = true;
            _completeCourse(quiz.courseId);
            
            // Check for perfect quiz achievement
            if (score == 100) {
                _checkPerfectQuizAchievement(msg.sender);
            }
        }
    }
    
    /**
     * @dev Check and award perfect quiz achievement
     * @param user Address of the user
     */
    function _checkPerfectQuizAchievement(address user) internal {
        for (uint256 i = 1; i < _nextAchievementId; i++) {
            Achievement storage achievement = achievements[i];
            if (achievement.isActive && 
                achievement.triggerType == AchievementTrigger.PERFECT_QUIZ && 
                !userAchievements[user][i]) {
                
                _awardAchievement(user, i);
                break;
            }
        }
    }
    
    /**
     * @dev Internal function to handle course completion
     * @param courseId ID of the completed course
     */
    function _completeCourse(uint256 courseId) internal {
        require(courseEnrollments[courseId][msg.sender], "Not enrolled in course");
        require(users[msg.sender].courseProgress[courseId] == 100, "Course not completed");
        require(quizCompleted[courseId][msg.sender], "Quiz not completed");
        require(!certificateIssued[courseId][msg.sender], "Certificate already issued");
        
        Course storage course = courses[courseId];
        
        // Add to completed courses
        users[msg.sender].completedCourses.push(courseId);
        course.completionCount++;
        
        // Award XP
        _awardUserXP(msg.sender, course.xpReward);
        
        // Award tokens
        if (course.tokenReward > 0) {
            require(learnToken.balanceOf(address(this)) >= course.tokenReward, "Insufficient reward pool");
            learnToken.transfer(msg.sender, course.tokenReward);
            emit RewardDistributed(msg.sender, course.tokenReward, "Course completion");
        }
        
        // Issue certificate
        _issueCertificate(courseId, msg.sender);
        
        // Check achievements
        _checkAndAwardAchievements(msg.sender);
        
        emit CourseCompleted(courseId, msg.sender);
    }
    
    /**
     * @dev Award XP to a user and check for level up
     * @param user Address of the user
     * @param xpAmount Amount of XP to award
     */
    function _awardUserXP(address user, uint256 xpAmount) internal {
        uint256 currentXP = users[user].xp;
        uint256 currentLevel = users[user].level;
        
        users[user].xp += xpAmount;
        
        // Check for level up
        uint256 newLevel = (users[user].xp / XP_PER_LEVEL) + 1;
        if (newLevel > currentLevel) {
            users[user].level = newLevel;
            emit UserLevelUp(user, newLevel);
            
            // Level up bonus
            uint256 levelUpBonus = 50 * 10**18 * (newLevel - currentLevel); // 50 tokens per level
            if (learnToken.balanceOf(address(this)) >= levelUpBonus) {
                learnToken.transfer(user, levelUpBonus);
                emit RewardDistributed(user, levelUpBonus, "Level up bonus");
            }
        }
    }
    
    /**
     * @dev Award XP to an instructor and check for level up
     * @param instructor Address of the instructor
     * @param xpAmount Amount of XP to award
     */
    function _awardInstructorXP(address instructor, uint256 xpAmount) internal {
        uint256 currentXP = instructors[instructor].xp;
        uint256 currentLevel = instructors[instructor].level;
        
        instructors[instructor].xp += xpAmount;
        
        // Check for level up
        uint256 newLevel = (instructors[instructor].xp / XP_PER_LEVEL) + 1;
        if (newLevel > currentLevel) {
            instructors[instructor].level = newLevel;
            emit UserLevelUp(instructor, newLevel);
            
            // Level up bonus
            uint256 levelUpBonus = 50 * 10**18 * (newLevel - currentLevel); // 50 tokens per level
            if (learnToken.balanceOf(address(this)) >= levelUpBonus) {
                learnToken.transfer(instructor, levelUpBonus);
                emit RewardDistributed(instructor, levelUpBonus, "Level up bonus");
            }
        }
    }
    
    /**
     * @dev Internal function to issue a certificate NFT
     * @param courseId ID of the completed course
     * @param recipient Address of the certificate recipient
     */
    function _issueCertificate(uint256 courseId, address recipient) internal {
        uint256 certificateId = _nextCertificateId++;
        
        // Create certificate metadata URI using IPFS
        string memory metadataURI = string(abi.encodePacked(
            "ipfs://QmSkillQuestCertificates/",
            _toString(certificateId),
            ".json"
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
     * @dev Check and award achievements based on user progress
     * @param user Address of the user
     */
    function _checkAndAwardAchievements(address user) internal {
        for (uint256 i = 1; i < _nextAchievementId; i++) {
            Achievement storage achievement = achievements[i];
            
            // Skip if not active or already earned
            if (!achievement.isActive || userAchievements[user][i]) {
                continue;
            }
            
            bool shouldAward = false;
            
            // Check achievement conditions
            if (achievement.triggerType == AchievementTrigger.COURSE_COUNT) {
                shouldAward = users[user].completedCourses.length >= achievement.triggerValue;
            } 
            else if (achievement.triggerType == AchievementTrigger.CERTIFICATE_COUNT) {
                shouldAward = users[user].totalCertificates >= achievement.triggerValue;
            }
            else if (achievement.triggerType == AchievementTrigger.XP_THRESHOLD) {
                shouldAward = users[user].xp >= achievement.triggerValue;
            }
            else if (achievement.triggerType == AchievementTrigger.STREAK_DAYS) {
                shouldAward = users[user].streak >= achievement.triggerValue;
            }
            
            // Award achievement if conditions met
            if (shouldAward) {
                _awardAchievement(user, i);
            }
        }
    }
    
    /**
     * @dev Check and award instructor achievements
     * @param instructor Address of the instructor
     */
    function _checkInstructorAchievements(address instructor) internal {
        for (uint256 i = 1; i < _nextAchievementId; i++) {
            Achievement storage achievement = achievements[i];
            
            // Skip if not active or already earned
            if (!achievement.isActive || userAchievements[instructor][i]) {
                continue;
            }
            
            bool shouldAward = false;
            
            // Check achievement conditions
            if (achievement.triggerType == AchievementTrigger.INSTRUCTOR_STUDENTS) {
                shouldAward = instructors[instructor].totalStudents >= achievement.triggerValue;
            } 
            else if (achievement.triggerType == AchievementTrigger.INSTRUCTOR_COURSES) {
                shouldAward = instructors[instructor].totalCourses >= achievement.triggerValue;
            }
            else if (achievement.triggerType == AchievementTrigger.INSTRUCTOR_RATING) {
                // For rating, we check if average rating * number of reviews >= trigger value
                // This ensures we have both good rating and sufficient reviews
                shouldAward = (instructors[instructor].averageRating * 10 >= achievement.triggerValue) && 
                              (instructors[instructor].totalReviews >= 10);
            }
            
            // Award achievement if conditions met
            if (shouldAward) {
                _awardAchievement(instructor, i);
            }
        }
    }
    
    /**
     * @dev Award an achievement to a user
     * @param user Address of the user
     * @param achievementId ID of the achievement
     */
    function _awardAchievement(address user, uint256 achievementId) internal {
        require(achievements[achievementId].isActive, "Achievement not active");
        require(!userAchievements[user][achievementId], "Achievement already earned");
        
        Achievement storage achievement = achievements[achievementId];
        
        // Award XP
        if (users[user].isRegistered) {
            _awardUserXP(user, achievement.xpReward);
        } else if (instructors[user].isRegistered) {
            _awardInstructorXP(user, achievement.xpReward);
        }
        
        // Award tokens
        if (achievement.tokenReward > 0) {
            require(learnToken.balanceOf(address(this)) >= achievement.tokenReward, "Insufficient reward pool");
            learnToken.transfer(user, achievement.tokenReward);
            emit RewardDistributed(user, achievement.tokenReward, "Achievement reward");
        }
        
        // Mark achievement as earned
        userAchievements[user][achievementId] = true;
        if (users[user].isRegistered) {
            users[user].earnedAchievements.push(achievementId);
        }
        
        emit AchievementEarned(user, achievementId, achievement.title);
    }
    
    /**
     * @dev Create a new achievement (internal)
     */
    function _createAchievement(
        string memory title,
        string memory description,
        string memory imageURI,
        uint256 xpReward,
        uint256 tokenReward,
        AchievementTrigger triggerType,
        uint256 triggerValue
    ) internal returns (uint256 achievementId) {
        achievementId = _nextAchievementId++;
        
        Achievement storage newAchievement = achievements[achievementId];
        newAchievement.id = achievementId;
        newAchievement.title = title;
        newAchievement.description = description;
        newAchievement.imageURI = imageURI;
        newAchievement.xpReward = xpReward;
        newAchievement.tokenReward = tokenReward;
        newAchievement.triggerType = triggerType;
        newAchievement.triggerValue = triggerValue;
        newAchievement.isActive = true;
        
        return achievementId;
    }
    
    /**
     * @dev Create a new achievement (admin only)
     */
    function createAchievement(
        string memory title,
        string memory description,
        string memory imageURI,
        uint256 xpReward,
        uint256 tokenReward,
        AchievementTrigger triggerType,
        uint256 triggerValue
    ) external onlyOwner returns (uint256) {
        return _createAchievement(
            title,
            description,
            imageURI,
            xpReward,
            tokenReward,
            triggerType,
            triggerValue
        );
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
        return instructors[instructor].createdCourses;
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
     * @dev Get user level
     * @param user Address of the user
     * @return level User level
     */
    function getUserLevel(address user) external view returns (uint256 level) {
        return users[user].level;
    }
    
    /**
     * @dev Get user streak
     * @param user Address of the user
     * @return streak Current streak days
     */
    function getUserStreak(address user) external view returns (uint256 streak) {
        return users[user].streak;
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
     * @dev Get course modules
     * @param courseId ID of the course
     * @return moduleIds Array of module IDs
     */
    function getCourseModules(uint256 courseId) external view returns (uint256[] memory moduleIds) {
        return courses[courseId].moduleIds;
    }
    
    /**
     * @dev Get module lessons
     * @param moduleId ID of the module
     * @return lessonIds Array of lesson IDs
     */
    function getModuleLessons(uint256 moduleId) external view returns (uint256[] memory lessonIds) {
        return modules[moduleId].lessonIds;
    }
    
    /**
     * @dev Get module details
     * @param moduleId ID of the module
     * @return title Module title
     * @return description Module description
     * @return orderIndex Module order index
     * @return isActive Whether the module is active
     */
    function getModuleDetails(uint256 moduleId) external view returns (
        string memory title,
        string memory description,
        uint256 orderIndex,
        bool isActive
    ) {
        Module storage module = modules[moduleId];
        return (
            module.title,
            module.description,
            module.orderIndex,
            module.isActive
        );
    }
    
    /**
     * @dev Get lesson details
     * @param lessonId ID of the lesson
     * @return title Lesson title
     * @return description Lesson description
     * @return contentType Content type
     * @return contentURI Content URI
     * @return duration Lesson duration
     * @return orderIndex Lesson order index
     * @return isActive Whether the lesson is active
     */
    function getLessonDetails(uint256 lessonId) external view returns (
        string memory title,
        string memory description,
        ContentType contentType,
        string memory contentURI,
        uint256 duration,
        uint256 orderIndex,
        bool isActive
    ) {
        Lesson storage lesson = lessons[lessonId];
        return (
            lesson.title,
            lesson.description,
            lesson.contentType,
            lesson.contentURI,
            lesson.duration,
            lesson.orderIndex,
            lesson.isActive
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
    
    /**
     * @dev Submit a review for an instructor
     * @param instructor Address of the instructor
     * @param courseId ID of the course
     * @param rating Rating (1-5)
     * @param comment Review comment
     */
    function submitReview(
        address instructor,
        uint256 courseId,
        uint256 rating,
        string memory comment
    ) external whenNotPaused {
        require(users[msg.sender].isRegistered, "User not registered");
        require(instructors[instructor].isRegistered, "Instructor not registered");
        require(!hasReviewed[msg.sender][instructor], "Already reviewed this instructor");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(courseEnrollments[courseId][msg.sender], "Not enrolled in course");
        require(users[msg.sender].courseProgress[courseId] == 100, "Course not completed");
        
        uint256 reviewId = _nextReviewId++;
        
        Review storage newReview = reviews[reviewId];
        newReview.id = reviewId;
        newReview.reviewer = msg.sender;
        newReview.instructor = instructor;
        newReview.courseId = courseId;
        newReview.rating = rating;
        newReview.comment = comment;
        newReview.timestamp = block.timestamp;
        newReview.isVerified = true;
        
        // Update instructor's average rating
        Instructor storage instructorData = instructors[instructor];
        uint256 totalRating = instructorData.averageRating * instructorData.totalReviews;
        instructorData.totalReviews++;
        instructorData.averageRating = (totalRating + rating) / instructorData.totalReviews;
        
        hasReviewed[msg.sender][instructor] = true;
        
        // Check instructor rating achievement
        _checkInstructorAchievements(instructor);
        
        emit ReviewSubmitted(reviewId, instructor, msg.sender, rating);
    }
    
    /**
     * @dev Get instructor reviews
     * @param instructor Address of the instructor
     * @return reviewIds Array of review IDs
     */
    function getInstructorReviews(address instructor) external view returns (uint256[] memory reviewIds) {
        uint256[] memory allReviews = new uint256[](_nextReviewId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < _nextReviewId; i++) {
            if (reviews[i].instructor == instructor) {
                allReviews[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allReviews[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get review details
     * @param reviewId ID of the review
     * @return reviewer Address of the reviewer
     * @return instructor Address of the instructor
     * @return courseId ID of the course
     * @return rating Rating given
     * @return comment Review comment
     * @return timestamp Review timestamp
     * @return isVerified Whether the reviewer completed the course
     */
    function getReviewDetails(uint256 reviewId) external view returns (
        address reviewer,
        address instructor,
        uint256 courseId,
        uint256 rating,
        string memory comment,
        uint256 timestamp,
        bool isVerified
    ) {
        Review storage review = reviews[reviewId];
        return (
            review.reviewer,
            review.instructor,
            review.courseId,
            review.rating,
            review.comment,
            review.timestamp,
            review.isVerified
        );
    }
    
    /**
     * @dev Get user achievements
     * @param user Address of the user
     * @return achievementIds Array of earned achievement IDs
     */
    function getUserAchievements(address user) external view returns (uint256[] memory achievementIds) {
        return users[user].earnedAchievements;
    }
    
    /**
     * @dev Get achievement details
     * @param achievementId ID of the achievement
     * @return title Achievement title
     * @return description Achievement description
     * @return imageURI Achievement image URI
     * @return xpReward XP reward
     * @return tokenReward Token reward
     * @return triggerType Achievement trigger type
     * @return triggerValue Achievement trigger value
     */
    function getAchievementDetails(uint256 achievementId) external view returns (
        string memory title,
        string memory description,
        string memory imageURI,
        uint256 xpReward,
        uint256 tokenReward,
        AchievementTrigger triggerType,
        uint256 triggerValue
    ) {
        Achievement storage achievement = achievements[achievementId];
        return (
            achievement.title,
            achievement.description,
            achievement.imageURI,
            achievement.xpReward,
            achievement.tokenReward,
            achievement.triggerType,
            achievement.triggerValue
        );
    }
    
    /**
     * @dev Get leaderboard by XP (top users)
     * @param count Number of users to return
     * @return userAddresses Array of user addresses
     * @return userXPs Array of user XP values
     * @return userLevels Array of user levels
     */
    function getLeaderboard(uint256 count) external view returns (
        address[] memory userAddresses,
        uint256[] memory userXPs,
        uint256[] memory userLevels
    ) {
        // Limit count to avoid gas issues
        if (count > registeredUsers.length) {
            count = registeredUsers.length;
        }
        
        // Create temporary arrays for sorting
        address[] memory tempAddresses = new address[](registeredUsers.length);
        uint256[] memory tempXPs = new uint256[](registeredUsers.length);
        uint256[] memory tempLevels = new uint256[](registeredUsers.length);
        
        // Fill temporary arrays
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            tempAddresses[i] = registeredUsers[i];
            tempXPs[i] = users[registeredUsers[i]].xp;
            tempLevels[i] = users[registeredUsers[i]].level;
        }
        
        // Simple bubble sort (not efficient but works for this example)
        for (uint256 i = 0; i < tempAddresses.length; i++) {
            for (uint256 j = i + 1; j < tempAddresses.length; j++) {
                if (tempXPs[j] > tempXPs[i]) {
                    // Swap XP
                    uint256 tempXP = tempXPs[i];
                    tempXPs[i] = tempXPs[j];
                    tempXPs[j] = tempXP;
                    
                    // Swap level
                    uint256 tempLevel = tempLevels[i];
                    tempLevels[i] = tempLevels[j];
                    tempLevels[j] = tempLevel;
                    
                    // Swap address
                    address tempAddr = tempAddresses[i];
                    tempAddresses[i] = tempAddresses[j];
                    tempAddresses[j] = tempAddr;
                }
            }
        }
        
        // Create result arrays with requested count
        userAddresses = new address[](count);
        userXPs = new uint256[](count);
        userLevels = new uint256[](count);
        
        // Fill result arrays
        for (uint256 i = 0; i < count; i++) {
            userAddresses[i] = tempAddresses[i];
            userXPs[i] = tempXPs[i];
            userLevels[i] = tempLevels[i];
        }
        
        return (userAddresses, userXPs, userLevels);
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
        // Deploy token with deployer as initial owner
        token = new SkillQuestToken(msg.sender);
        
        // Deploy platform
        platform = new SkillQuest(address(token));
        
        // Calculate reward pool amount (30% of total supply)
        uint256 rewardPoolAmount = 30000000 * 10**18; // 30 million tokens for rewards
        
        // Approve platform to spend tokens
        token.approve(address(platform), rewardPoolAmount);
        
        // Transfer tokens to platform for rewards
        token.transferFrom(msg.sender, address(platform), rewardPoolAmount);
    }
}
