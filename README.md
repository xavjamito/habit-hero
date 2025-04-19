# Habit Hero

![Habit Hero](generated-icon.png)

Habit Hero is a modern, full-stack web application designed to help users build and maintain positive habits. Track your daily progress, visualize your streaks, and stay motivated with comprehensive statistics and insights.

## Features

- **Habit Tracking**: Create, edit, and delete custom habits
- **Daily Check-ins**: Mark habits as complete each day to build your streak
- **Streak Tracking**: View your current streak for each habit to stay motivated
- **Visual Progress**: Interactive progress bars and visual indicators for completion rates
- **Dashboard**: Overview of all your habits and progress in one place
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **User Authentication**: Secure login/registration system
- **Data Persistence**: All your habits and progress are saved in a database

## Technology Stack

### Frontend

- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn UI**: Modern component library
- **Framer Motion**: Animation library for smooth transitions
- **React Query**: Data fetching and state management
- **date-fns**: Date utility library
- **Lucide Icons**: SVG icon library
- **React Hook Form**: Form validation and management

### Backend

- **Express.js**: Web server framework
- **Prisma**: Modern ORM for database access
- **MongoDB**: NoSQL database for data storage
- **Passport.js**: Authentication middleware
- **Zod**: Schema validation

### Development Tools

- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler
- **TypeScript**: Static type checking

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/habit-hero.git
   cd habit-hero
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
habit-hero/
├── client/               # Frontend code
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Application pages
│   │   └── App.tsx       # Main application component
│   └── index.html        # HTML entry point
├── server/               # Backend code
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication logic
│   └── prisma.ts         # Database connection
├── shared/               # Shared code between client and server
│   └── schema/           # Data schemas
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
└── package.json          # Project dependencies
```

## Usage

### Creating a New Habit

1. Navigate to the "Habits" page
2. Click the "+" button to add a new habit
3. Fill in the habit details (name, description, color)
4. Click "Create" to save your new habit

### Tracking Your Progress

1. On the dashboard or habits page, find the habit you want to track
2. Click the circle next to the habit to mark it as complete for the day
3. Your streak will automatically update

### Viewing Your Stats

- The dashboard provides an overview of all your habits
- Each habit card shows:
  - Current streak
  - Weekly completion percentage
  - Visual progress indicators

## Customization

### Theme Customization

The application uses Tailwind CSS for styling. You can customize the theme by modifying the `tailwind.config.ts` file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
- [React Query](https://tanstack.com/query/latest/) for data fetching
- All open-source libraries that made this project possible
