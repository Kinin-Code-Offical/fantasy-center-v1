# Fantasy Center

A next-generation fantasy sports management and trading platform featuring an immersive cyberpunk interface.

## 🚀 Features

- **Immersive UI**: Cyberpunk-themed interface with terminal-style news readers, 3D background elements, and retro-futuristic styling.
- **Fantasy Integration**: Seamless connection with Yahoo Fantasy Sports to import leagues, teams, and rosters.
- **Transaction Sync**: Automatic synchronization of real-world Yahoo trades, adds, and drops to keep local rosters up-to-date.
- **Marketplace**: Advanced trading system for players and fantasy assets.
- **Real-time Intelligence**: "Decrypted Data" terminal for player news and updates.
- **Secure Authentication**: Robust user management with NextAuth.js, including email verification and secure account handling.
- **Data Visualization**: Interactive charts and stats using Recharts.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: Zustand
- **3D Graphics**: React Three Fiber / Drei
- **Authentication**: NextAuth.js
- **Utilities**: Lucide React, Recharts, Upstash Redis

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL Database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fantasy-center-v1.git
   cd fantasy-center-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fantasy_db"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Yahoo Fantasy API
   YAHOO_CLIENT_ID="your-yahoo-client-id"
   YAHOO_CLIENT_SECRET="your-yahoo-client-secret"
   
   # Email Provider (SMTP)
   EMAIL_SERVER_HOST="smtp.example.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="apikey"
   EMAIL_SERVER_PASSWORD="your-email-password"
   EMAIL_FROM="noreply@example.com"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components
│   ├── league/       # League-specific components
│   ├── market/       # Marketplace components
│   ├── news/         # News reader and terminal components
│   └── ...
├── lib/              # Utility functions, actions, and hooks
├── types/            # TypeScript type definitions
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
