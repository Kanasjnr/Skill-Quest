import React from 'react';
// import Rectangle from '../../../public/assets/Rectangle.png';

const KeyFeatures = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl">
      <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
      
      {/* On-chain Learning Analytics */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-16">
        <div className="w-full md:w-2/3 mb-6 md:mb-0">
          <div className="flex items-start mb-2">
            <span className="text-yellow-400 text-2xl mr-2">✷</span>
            <h3 className="text-2xl font-bold text-yellow-400">On-chain Learning Analytics:</h3>
          </div>
          <ul className="ml-8 space-y-2">
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
        <div className="w-full md:w-1/3 flex justify-center">
          <img src="/assets/Rectangle.png" alt="Blue mascot with crown" className="w-32 h-32" />
        </div>
      </div>
      
      {/* NFT-Based Certification */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-center mb-16">
        <div className="w-full md:w-2/3 mb-6 md:mb-0">
          <div className="flex items-start mb-2">
            <span className="text-yellow-400 text-2xl mr-2">✷</span>
            <h3 className="text-2xl font-bold text-yellow-400">NFT-Based Certification:</h3>
          </div>
          <ul className="ml-8 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Learner's receive NFT certificates upon course completion, stored on-chain for verifiable proof of skills.</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>These NFT's serve as immutable records of achievement and skill mastery</p>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/3 flex justify-center">
          <img src="/assets/cup.png" alt="Shield certification icon" className="w-32 h-32" />
        </div>
      </div>
      
      {/* Tokenized Incentives */}
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="w-full md:w-2/3 mb-6 md:mb-0">
          <div className="flex items-start mb-2">
            <span className="text-yellow-400 text-2xl mr-2">✷</span>
            <h3 className="text-2xl font-bold text-yellow-400">Tokenized Incentives:</h3>
          </div>
          <ul className="ml-8 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Native platform tokens are rewarded for completing courses, quizzes, and community participation</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>Tokens can be used to unlock advanced courses or exchanged for real-world value.</p>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/3 flex justify-center">
          <img src="/assets/coin.png" alt="Token coins" className="w-32 h-32" />
        </div>
      </div>
    </div>
  );
};

export default KeyFeatures;