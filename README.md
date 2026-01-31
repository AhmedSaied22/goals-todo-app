# GoalMaster - Goals & Todo MVP

A simple, fast, and beautiful MVP web application for tracking goals with progress charts and managing todos.

![GoalMaster Screenshot](./screenshot.png)

## 🚀 Features

### Goals
- Create, update, and delete goals
- Track progress with +5%/-5% buttons
- Visual progress bars with gradient styling
- Status badges (Not Started, In Progress, Completed)

### Todos
- Add, complete, and delete todos
- Link todos to goals (completing linked todos adds +5% to goal)
- Filter todos: All, Today, Done, Pending
- Timestamps for each todo

### Dashboard
- Summary stats cards
- Pie chart showing goals status distribution
- Bar chart showing top 5 goals by progress
- Real-time data updates

### UI/UX
- 🌗 Dark/Light mode support
- 📱 Responsive design (desktop + mobile)
- 🎨 Modern glassmorphism design
- ✨ Smooth animations and transitions
- 🔔 Toast notifications for actions

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui style (Radix primitives)
- **Icons**: Lucide React
- **State**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Dates**: date-fns
- **Notifications**: Sonner
- **Mobile Drawer**: Vaul

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── Sidebar.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Progress.tsx
│   │   ├── Select.tsx
│   │   ├── Skeleton.tsx
│   │   └── Tabs.tsx
│   ├── ProtectedRoute.tsx
│   └── ThemeProvider.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useGoals.ts
│   └── useTodos.ts
├── lib/
│   ├── firebase.ts
│   ├── firestore.ts
│   └── utils.ts
├── pages/
│   ├── DashboardPage.tsx
│   ├── GoalsPage.tsx
│   ├── LoginPage.tsx
│   └── TodosPage.tsx
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
├── router.tsx
└── index.css
```

## 🔧 Setup

### 1. Clone and Install

```bash
cd goals-todo-app
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → **Google Sign-In**
3. Enable **Firestore Database**
4. Get your Firebase config from Project Settings

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Security Rules

In Firebase Console, go to Firestore → Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📊 Firestore Data Structure

```
users/{uid}
  ├── goals/{goalId}
  │     - title: string
  │     - currentPercent: number (0-100)
  │     - createdAt: timestamp
  └── todos/{todoId}
        - title: string
        - isDone: boolean
        - goalId: string (optional)
        - createdAt: timestamp
```

## 🚀 Deployment (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📝 License

MIT License - feel free to use this for your portfolio or projects!
