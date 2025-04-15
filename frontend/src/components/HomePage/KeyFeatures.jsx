import React from 'react';
// import Rectangle from '../../../public/assets/Rectangle.png';

const KeyFeatures = () => {
  // Use a dark background matching the design
  const sectionBg = 'bg-[#1A1633]'; // Background color from the image
  const starColor = 'text-yellow-400'; // Color for the star icon
  const headingColor = 'text-white'; // Color for the feature headings
  const textColor = 'text-gray-300'; // Color for the feature descriptions

  return (
    // Added padding for the section container
    <div className={`p-8 md:p-16 rounded-3xl my-8 ${sectionBg} max-w-6xl mx-auto`}>
      <h2 className="text-4xl font-bold text-white text-center mb-16">Key Features</h2>
      
      {/* On-chain Learning Analytics */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-20 md:mb-24" id="features">
        <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
          <div className="flex items-center mb-3">
            <span className={`${starColor} text-xl mr-2`}>✷</span>
            <h3 className={`text-xl font-semibold ${headingColor}`}>On-chain Learning Analytics:</h3>
          </div>
          <ul className={`ml-6 space-y-2 ${textColor} text-sm`}> {/* Adjusted text size */}
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Courses are structured with levels, quests, and challenges to enhance engagement.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Learners earn XP points and token rewards upon course completion.</p>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          {/* Adjusted image size slightly */}
          <img src="/Rectangle.png" alt="On-chain Learning Analytics" className="w-36 h-auto md:w-44" />
        </div>
      </div>
      
      {/* NFT-Based Certification */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-center mb-20 md:mb-24">
        <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pl-12">
          <div className="flex items-center mb-3">
            <span className={`${starColor} text-xl mr-2`}>✷</span>
            <h3 className={`text-xl font-semibold ${headingColor}`}>NFT-Based Certification:</h3>
          </div>
          <ul className={`ml-6 space-y-2 ${textColor} text-sm`}> {/* Adjusted text size */}
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Learners receive NFT certificates upon course completion, stored on-chain for verifiable proof of skills.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>These NFTs serve as immutable records of achievement and skill mastery.</p>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/2 flex justify-center md:justify-start">
           {/* Adjusted image size slightly */}
          <img src="/cup.png" alt="NFT-Based Certification" className="w-36 h-auto md:w-44" />
        </div>
      </div>
      
      {/* Tokenized Incentives */}
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
          <div className="flex items-center mb-3">
            <span className={`${starColor} text-xl mr-2`}>✷</span>
            <h3 className={`text-xl font-semibold ${headingColor}`}>Tokenized Incentives:</h3>
          </div>
          <ul className={`ml-6 space-y-2 ${textColor} text-sm`}> {/* Adjusted text size */}
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Native platform tokens are rewarded for completing courses, quizzes, and community participation.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Tokens can be used to unlock advanced courses or exchanged for real-world value.</p>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          {/* Adjusted image size slightly */}
          <img src="/coin.png" alt="Tokenized Incentives" className="w-36 h-auto md:w-44" />
        </div>
      </div>
    </div>
  );
};

export default KeyFeatures;