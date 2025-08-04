# Image Manager

A local image vector search application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Clean, modern UI design
- Drag and drop image upload
- Dark mode support
- Responsive layout
- TypeScript for type safety
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page with drag & drop
├── components/          # React components (future)
└── lib/                # Utility functions (future)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter (Google Fonts)
- **Linting**: ESLint with Next.js config

## Next Steps

This is a basic setup. You can now add:

1. Image upload functionality with file system integration
2. Vector search implementation
3. Image gallery display
4. Search interface
5. Database integration
