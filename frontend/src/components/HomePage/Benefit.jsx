import React from 'react';

const Benefit = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-xl relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          How Does SKILLQUEST Benefit You<span className="text-green-400">?</span>
        </h2>
        
        <div className="flex flex-col md:flex-row">
          {/* Left side - Character image */}
          <div className="w-full md:w-1/3 flex justify-center mb-8 md:mb-0">
            <img src="/assets/bearma.png" alt="Character with glasses and beard" className="h-auto max-h-96" />
          </div>
          
          {/* Right side - Benefits content */}
          <div className="w-full md:w-2/3 space-y-12">
            {/* Cross-Platform Integration */}
            <div>
              <div className="flex items-center mb-4">
                <span className="text-yellow-400 text-2xl mr-3">✷</span>
                <h3 className="text-2xl font-bold">
                  <span className="text-green-400">Cross-Platform</span> Integration:
                </h3>
              </div>
              <ul className="ml-10 space-y-4">
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  <p className="text-gray-200 text-lg">
                    Seamless integration withWeb3 wallets {'{e.g., Metamask}'} for authentication and transactions.
                  </p>
                </li>
              </ul>
            </div>
            
            {/* Skill Progression System */}
            <div>
              <div className="flex items-center mb-4">
                <span className="text-yellow-400 text-2xl mr-3">✷</span>
                <h3 className="text-2xl font-bold">
                  <span className="text-green-400">Skill Progression</span> System
                </h3>
              </div>
              <ul className="ml-10 space-y-4">
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  <p className="text-gray-200 text-lg">
                    Learning is structured in a skill tree format where users unlock advanced topics by completing foundational ones.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  <p className="text-gray-200 text-lg">
                    Users can showcase their progress through on-chain skill badge.
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