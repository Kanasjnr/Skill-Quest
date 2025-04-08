// import React from 'react';
// import bgImage from '../assets/LooperBG.png';


// const Hero = () => {
//   return (
//     <div 
//       className="w-full relative"
//       style={{ 
//         backgroundImage: `url(${bgImage})`,
//         backgroundPosition: "centre",
//         backgroundSize: "cover",
//         backgroundRepeat: "no-repeat"
//       }}
//     >
//       {/* Add a fallback background in case the image doesn't load */}
//       <div className='absolute inset-0 bg-[#130F26] opacity-90'></div>
      
//       <div className='relative px-4 sm:px-6 md:px-10 py-10 md:py-16 flex flex-col justify-center items-center min-h-[70vh] z-10'>
//         <div className='max-w-4xl mx-auto text-center'>
//           <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#FFF] mb-3 sm:mb-4 font-bold leading-tight'> 
//             <span className='text-gradient-custom'>Learn, Earn, and Master Skills in</span> Web3 
//           </h2>
//           <p className='text-xs sm:text-sm md:text-base text-[#D3D3D3] text-center mb-6 sm:mb-8 max-w-2xl mx-auto'>
//             A decentralized ecosystem where education meets gamification and blockchain rewards.
//           </p>
//         </div>
        
//         <div className='flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2 pb-10 md:pb-20 w-full max-w-md justify-center'>
//           <button className='bg-[yellow] hover:bg-yellow-400 transition-colors rounded-full px-6 md:px-10 py-2 md:py-3 font-medium text-sm md:text-base'>
//             Connect
//           </button>
//           <button className='rounded-full px-6 md:px-10 py-2 md:py-3 border-2 border-white text-[#FFF] hover:bg-white/10 transition-colors font-medium text-sm md:text-base'>
//             Connect
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Hero;

import React from 'react';

const Hero = () => {
  return (
    <div 
      className="w-full relative"
      style={{ 
        backgroundImage: "url('/LooperBG.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay */}
      <div className='absolute inset-0 bg-[#130F26] opacity-80'></div>

      <div className='relative px-4 sm:px-6 md:px-10 py-10 md:py-16 flex flex-col justify-center items-center min-h-[70vh] z-10'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#FFF] mb-3 sm:mb-4 font-bold leading-tight'> 
            <span className='text-gradient-custom'>Learn, Earn, and Master Skills in</span> Web3 
          </h2>
          <p className='text-xs sm:text-sm md:text-base text-[#D3D3D3] text-center mb-6 sm:mb-8 max-w-2xl mx-auto'>
            A decentralized ecosystem where education meets gamification and blockchain rewards.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2 pb-10 md:pb-20 w-full max-w-md justify-center'>
          <button className='bg-[yellow] hover:bg-yellow-400 transition-colors rounded-full px-6 md:px-10 py-2 md:py-3 font-medium text-sm md:text-base'>
            Connect
          </button>
          <button className='rounded-full px-6 md:px-10 py-2 md:py-3 border-2 border-white text-[#FFF] hover:bg-white/10 transition-colors font-medium text-sm md:text-base'>
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
