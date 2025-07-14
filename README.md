# 🎮 **FunSkool Strike4 – The Ultimate AI-Powered Connect 4 Game**

**FunSkool Strike4** is a powerful, visually rich, and AI-driven online version of the classic Connect 4 game. Featuring a smart opponent, colorful UI, real-time gameplay, and rich animations, it’s perfect for both casual gamers and competitive strategists.

> 🧠 Built with TypeScript + React, powered by AI logic and styled with TailwindCSS, this project represents the future of digital board games.

---

## 🔗 **Project Links**

- 🌐 **Live Demo:** [https://strike4-funskool-grid-avadhesh-game.netlify.app/](https://strike4-funskool-grid-avadhesh-game.netlify.app/)


---

---

## 📸 **Screenshots**

---
### **![Game Interface]**

<img width="1891" height="1074" alt="image" src="https://github.com/user-attachments/assets/481685d8-7f8a-4e15-ac8a-7b906915b1b7" />

---

### ***![Battle with Friend]***

<img width="1897" height="1077" alt="image" src="https://github.com/user-attachments/assets/1fd0a9b0-61fd-4f31-8236-7161119717f4" />

---

### ***![AI Battle in Action]***

<img width="1908" height="1073" alt="image" src="https://github.com/user-attachments/assets/aea2f7a4-e4de-4f6c-9854-9616e59287d7" />



---

## 🎯 **Key Features**

### 🔹 **AI-Powered Gameplay**
- Implements **Minimax Algorithm** with optional **advanced heuristics**.
- Includes both basic and advanced AI opponents.
- Smart move selection and board evaluation.

### 🌐 **Multiplayer Ready (Planned)**
- Designed to scale into multiplayer battles via WebSockets.
- Local 2-player mode implemented.

### 🎨 **Modern Funskool UI**
- Responsive, animated game grid using **Canvas**.
- Vibrant tokens and fun transitions.
- Clean, user-friendly layout.

### ⚙️ **Custom Game Modes**
- 🎮 Single Player vs AI
- 👥 Local 2-Player
- 📘 Tutorial Mode (Coming Soon)

---

## 🛠️ **Tech Stack**

| Layer         | Technology                 |
|---------------|-----------------------------|
| 🎨 Frontend   | React + TypeScript          |
| 💄 Styling    | Tailwind CSS                |
| 🤖 AI Logic   | Custom Minimax & Heuristics |
| 🧠 Advanced AI| Modular AI strategy engine  |
| 🧪 Tooling    | Vite, ESLint, PostCSS       |

---

## 📂 **Folder Structure**

```bash
/FunSkool_Strike4-AI-Game
├── .bolt/                          # Configuration & build tools
├── src/
│   ├── components/                 # Game UI components
│   │   ├── CanvasAIGame.tsx
│   │   ├── GameBoard.tsx
│   │   ├── GameCell.tsx
│   │   ├── GameHeader.tsx
│   │   ├── GameStats.tsx
│   │   └── PlayerSetup.tsx
│   ├── types/                      # TypeScript types
│   │   └── game.ts
│   ├── utils/                      # Game logic & AI
│   │   ├── advancedAIs.ts
│   │   ├── aiLogic.ts
│   │   └── gameLogic.ts
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   └── vite-env.d.ts               # Vite environment
├── public/                         # Static assets
├── index.html                      # App HTML shell
├── tailwind.config.js              # Tailwind CSS config
├── vite.config.ts                  # Vite config
├── tsconfig.json                   # TS project config
├── postcss.config.js               # PostCSS config
├── README.md                       # This file ✨

```

### 1. Clone the Repository
```bash
git clone https://github.com/avadheshgithub/FunSkool_strike4-AI-Game.git
cd FunSkool_strike4-AI-Game
```

### 2. Install Dependencies

```bash
npm install

```

### 3. Start the Dev Server
```bash
npm run dev

```
