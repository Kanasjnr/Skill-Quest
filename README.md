# SkillQuest

SkillQuest is a decentralized learning platform built on the Pharos blockchain that enables users to learn, earn, and verify their skills through blockchain technology. Our platform revolutionizes traditional learning by providing verifiable credentials and tokenized rewards for educational achievements.

## 🌟 Key Features

- 🎓 **Decentralized Learning Platform**
  - Peer-to-peer learning environment
  - Community-driven content creation
  - Transparent learning progress tracking

- 💰 **Learn Token (LRN) Economy**
  - Earn LRN tokens for completing courses
  - Stake tokens to access premium content

- 📜 **Blockchain-Verified Certificates**
  - Immutable proof of achievement
  - Shareable digital credentials

- 🔐 **Secure Wallet Integration**
  - Seamless Reown AppKit integration
  - Multi-wallet support
  - Secure transaction handling

- 🎯 **Skill-Based Learning Paths**
  - Personalized learning journeys
  - Skill tree progression system
  - Industry-aligned curriculum

- 📱 **Responsive Design**
  - Mobile-first approach
  - Cross-platform compatibility
  - Intuitive user interface

## 🛠️ Tech Stack

- **Frontend**
  - React.js (v18+)
  - Vite (Build tool)
  - TypeScript
  - React Router v6
  - Tailwind CSS
  - React Query

- **Blockchain**
  - Pharos Devnet
  - Web3.js
  - Ethers.js

- **Smart Contracts**
  - Solidity (v0.8.x)
  - Hardhat
  - OpenZeppelin Contracts

- **Development Tools**
  - ESLint
  - Prettier
  - Husky
  - Jest
  - Cypress

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm (v8+) or yarn (v1.22+)
- MetaMask or any Web3 wallet
- Pharos Devnet configured in your wallet
- Git

## 🚀 Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/skill-quest.git
cd skill-quest
```

2. **Install dependencies:**
```bash
cd frontend
npm install
```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
```env
VITE_APP_APPKIT_PROJECT_ID=your_project_id
VITE_APP_PHAROS_RPC_URL=your_rpc_url
VITE_APP_PHAROS_EXPLORER_URL=your_explorer_url
VITE_APP_PHAROS_CHAIN_ID=50002
VITE_APP_SKILL_QUEST_ADDRESS=your_contract_address
VITE_APP_LEARN_TOKEN_ADDRESS=your_token_address
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Run tests:**
```bash
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
```

## 📁 Project Structure

```
skill-quest/
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── common/    # Shared components
│   │   │   ├── layout/    # Layout components
│   │   │   └── features/  # Feature-specific components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React context providers
│   │   ├── config/       # Configuration files
│   │   ├── utils/        # Utility functions
│   │   ├── types/        # TypeScript type definitions
│   │   ├── services/     # API and blockchain services
│   │   └── assets/       # Static assets
│   ├── public/           # Public assets
│   ├── tests/            # Test files
│   └── cypress/          # E2E test files
├── contract/             # Smart contracts
│   ├── contracts/        # Solidity contracts
│   ├── scripts/          # Deployment scripts
│   ├── test/            # Contract tests
│   └── hardhat.config.js # Hardhat configuration
└── docs/                # Documentation
```

## 📝 Smart Contracts

The project includes the following smart contracts:

- **SkillQuest.sol**
  - Main platform contract
  - Handles course management
  - Manages user progress
  - Controls certification issuance

- **LearnToken.sol**
  - ERC20 token implementation
  - Reward distribution system
  - Staking mechanism
  - Governance features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Install dependencies (`npm install`)
4. Make your changes
5. Run tests (`npm run test`)
6. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
7. Push to the branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Reown AppKit](https://reown.io) for wallet integration
- [Pharos Network](https://pharosscan.xyz) for blockchain infrastructure
- [Tailwind CSS](https://tailwindcss.com) for styling
- [OpenZeppelin](https://openzeppelin.com) for smart contract libraries

<!-- ## 💬 Community

- [Discord](https://discord.gg/skillquest)
- [Twitter](https://twitter.com/skillquest)
- [Blog](https://blog.skillquest.com)

## 🆘 Support

For support:
- Email: support@skillquest.com
- Documentation: [docs.skillquest.com](https://docs.skillquest.com) -->

## 🔄 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] AI-powered learning recommendations
- [ ] Cross-chain integration
- [ ] NFT-based achievements
- [ ] DAO governance implementation

## 📊 Project Status

- Frontend: Beta
- Smart Contracts: Completed
- Documentation: In Progress
- Web App: Planned 