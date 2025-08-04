# Image Manager

A local image vector search application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🖼️ **Drag & Drop Upload** - Intuitive image upload with visual feedback
- 🗂️ **Image Gallery** - Grid view of uploaded images with thumbnails
- 🗑️ **Delete Functionality** - Remove images with hover-to-reveal delete buttons
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Dark Theme** - Modern terminal-inspired dark interface
- 🔄 **Duplicate Prevention** - Automatically skips duplicate files
- 📊 **File Information** - Shows filename and file size for each image
- ⚡ **Real-time Updates** - Instant feedback for upload and delete operations

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
│   ├── api/                    # API routes
│   │   ├── images/            # Image listing and deletion
│   │   └── upload/            # File upload handling
│   ├── globals.css            # Global styles and Tailwind
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main application page
├── components/                 # React components
│   ├── Header.tsx             # Application header
│   ├── Toast.tsx              # Notification component
│   ├── ImageUpload.tsx        # Drag & drop upload area
│   ├── ImageGrid.tsx          # Image gallery grid
│   ├── ImageThumbnail.tsx     # Individual image thumbnail
│   ├── useImageUpload.ts      # Custom hook for upload logic
│   ├── types.ts               # TypeScript interfaces
│   └── index.ts               # Component exports
└── lib/                       # Utility functions (future)

public/
├── images/                    # Static image assets
│   ├── icons/                 # UI icons
│   ├── logos/                 # Brand logos
│   ├── backgrounds/           # Background images
│   └── ui/                    # UI element images
└── uploads/                   # User uploaded images
```

## Component Architecture

The application is built with a modular component structure:

- **Header** - Displays app title and description
- **ImageUpload** - Handles drag & drop with visual feedback
- **ImageGrid** - Manages the grid layout of uploaded images
- **ImageThumbnail** - Individual image display with delete functionality
- **Toast** - Shows upload/delete notifications
- **useImageUpload** - Custom hook managing all upload/delete logic

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Upload Handling**: react-dropzone
- **Font**: JetBrains Mono (Terminal aesthetic)
- **Linting**: ESLint with Next.js config

## API Endpoints

- `GET /api/images` - List all uploaded images
- `POST /api/upload` - Upload new images
- `DELETE /api/images/delete` - Delete an image

## Next Steps

Future enhancements could include:

1. **Vector Search** - Implement image similarity search
2. **Image Processing** - Add filters, cropping, and editing
3. **User Authentication** - Multi-user support
4. **Database Integration** - Persistent storage
5. **Advanced Search** - Text-based image search
6. **Image Metadata** - EXIF data extraction and display
