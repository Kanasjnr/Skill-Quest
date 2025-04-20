# SkillQuest

SkillQuest is a decentralized learning platform built on the Pharos blockchain that enables users to learn, earn, and verify their skills through blockchain technology.

## Features

- 🎓 Decentralized Learning Platform
- 💰 Earn Learn Tokens (LRN) for completing courses
- 📜 Blockchain-verified certificates
- 🔐 Secure wallet integration
- 🎯 Skill-based learning paths
- 📱 Responsive design

## Tech Stack

- **Frontend**: React.js, Vite
- **Blockchain**: Pharos Devnet
- **Smart Contracts**: Solidity
- **Wallet Integration**: Reown AppKit
- **Styling**: Tailwind CSS
- **Routing**: React Router

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or any Web3 wallet
- Pharos Devnet configured in your wallet

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/skill-quest.git
cd skill-quest
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
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

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
skill-quest/
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React context providers
│   │   ├── config/       # Configuration files
│   │   └── assets/       # Static assets
│   └── public/           # Public assets
└── contract/             # Smart contracts
```

## Smart Contracts

The project includes the following smart contracts:
- SkillQuest.sol: Main platform contract
- LearnToken.sol: ERC20 token for rewards

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Reown AppKit](https://reown.io) for wallet integration
- [Pharos Network](https://pharosscan.xyz) for blockchain infrastructure
- [Tailwind CSS](https://tailwindcss.com) for styling

## Support

For support, email support@skillquest.com. 