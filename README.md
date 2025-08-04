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
- 📁 **Directory Management** - Add and manage directories to scan for images
- 🔍 **Directory Scanning** - Scan directories to find and index images
- 🧠 **Vector Search** - Store images with embeddings for similarity search
- 📈 **Scan Progress** - Real-time feedback during directory scanning
- 🤖 **AI Embeddings** - Generate embeddings using ResNet50 ONNX model
- 🔍 **Similarity Search** - Find similar images using cosine similarity

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Qdrant vector database (running on localhost:6333)

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
- **Vector Database**: Qdrant
- **AI Model**: ResNet50 ONNX (resnet50-v1-7.onnx) - 1000-dim output
- **Image Processing**: Sharp
- **ML Runtime**: ONNX Runtime Node.js

## API Endpoints

- `GET /api/images` - List all uploaded images
- `POST /api/upload` - Upload new images
- `DELETE /api/images/delete` - Delete an image
- `GET /api/directories` - List all directory configurations
- `POST /api/directories` - Add or update directory configuration
- `DELETE /api/directories/delete` - Delete a directory configuration
- `POST /api/directories/scan` - Start/stop scanning a directory for images
- `POST /api/test-embedding` - Test embedding generation for an image
- `GET /api/test-model` - Test ResNet50 model loading

## Embedding Generation

The application uses a ResNet50 ONNX model to generate 2048-dimensional embeddings for images:

### Model Details
- **Model**: ResNet50 (resnet50-v1-7.onnx)
- **Input Size**: 224x224 pixels
- **Output**: 1000-dimensional normalized vectors (ImageNet classification output)
- **Normalization**: L2 normalization for cosine similarity

### Embedding Process
1. **Image Preprocessing**: Resize to 224x224, normalize with ImageNet mean/std
2. **Model Inference**: Run ResNet50 to extract features
3. **Vector Normalization**: L2 normalize for cosine similarity search
4. **Storage**: Store in Qdrant vector database

### Usage
- Embeddings are automatically generated when images are uploaded
- Embeddings are generated during directory scanning
- Use the test endpoints to verify embedding generation

## Next Steps

Future enhancements could include:

1. **Similarity Search UI** - Add interface for finding similar images
2. **Image Processing** - Add filters, cropping, and editing
3. **User Authentication** - Multi-user support
4. **Database Integration** - Persistent storage
5. **Advanced Search** - Text-based image search
6. **Image Metadata** - EXIF data extraction and display
7. **Background Jobs** - Implement proper background scanning for large directories
8. **Model Optimization** - Optimize ResNet50 for better performance
