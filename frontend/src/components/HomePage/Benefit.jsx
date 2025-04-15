import React from 'react';

const Benefit = () => {
  // Use a dark background matching the design, adjust if needed
  const sectionBg = 'bg-[#130F26]'; 
  const starColor = 'text-yellow-400'; // Color for the star icon
  const highlightColor = 'text-green-500'; // Adjusted green color
  const headingColor = 'text-white'; // Color for the section headings
  const textColor = 'text-gray-300'; // Color for the descriptions

  return (
    <div className={`p-8 md:p-16 relative overflow-hidden my-8 ${sectionBg} max-w-6xl mx-auto`} id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl md:text-4xl font-bold text-center mb-16 ${headingColor}`}>
          How Does SKILLQUEST Benefit You<span className={highlightColor}>?</span>
        </h2>
        
        <div className="flex flex-col md:flex-row items-center">
          {/* Left side - Character image */}
          <div className="w-full md:w-1/3 flex justify-center mb-12 md:mb-0">
            <img src="/bearma.png" alt="Skillquest Benefit Character" className="h-auto max-h-80 md:max-h-96" />
          </div>
          
          {/* Right side - Benefits content */}
          <div className="w-full md:w-2/3 md:pl-12 space-y-10">
            {/* Cross-Platform Integration */}
            <div>
              <div className="flex items-center mb-3">
                <span className={`${starColor} text-2xl mr-2`}>✷</span>
                <h3 className={`text-2xl font-semibold ${headingColor}`}>
                  <span className={highlightColor}>Cross-Platform</span> Integration:
                </h3>
              </div>
              <ul className={`ml-7 space-y-2 ${textColor} text-base`}>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>
                    Seamless integration with Web3 wallets (e.g., Metamask) for authentication and transactions.
                  </p>
                </li>
              </ul>
            </div>
            
            {/* Skill Progression System */}
            <div>
              <div className="flex items-center mb-3">
                <span className={`${starColor} text-2xl mr-2`}>✷</span>
                <h3 className={`text-2xl font-semibold ${headingColor}`}>
                  <span className={highlightColor}>Skill Progression</span> System
                </h3>
              </div>
              <ul className={`ml-7 space-y-2 ${textColor} text-base`}>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>
                    Learning is structured in a skill tree format where users unlock advanced topics by completing foundational ones.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>
                    Users can showcase their progress through on-chain skill badges.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefit;