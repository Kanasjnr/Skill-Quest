import React from 'react';

const Hero = () => {
  return (
    <div className="w-full relative pt-24 md:pt-32">
      {/* Optional overlay if needed for text contrast */}
      {/* <div className='absolute inset-0 bg-[#130F26] opacity-50'></div> */}

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col justify-center items-center min-h-[calc(60vh-6rem)] z-10'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 font-bold leading-tight'> 
            Learn, Earn, and Master Skills in <span className='text-green-400'>Web3</span> 
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-gray-300 text-center mb-8 max-w-2xl mx-auto'>
            A decentralized ecosystem where education meets gamification and blockchain rewards.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 sm:gap-5 w-full max-w-sm justify-center'>
          <button className='bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-full px-8 py-3 font-semibold text-sm text-black'>
            Connect Wallet
          </button>
          <button className='rounded-full px-8 py-3 border border-white text-white hover:bg-white/10 transition-colors font-semibold text-sm'>
            Explore Features
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;