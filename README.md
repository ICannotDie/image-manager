# Image Manager

A Next.js application for managing and searching images using AI-powered similarity search.

## Features

- **Directory Management**: Add, edit, and delete directories to scan for images
- **Image Upload**: Fast drag-and-drop image upload without AI processing
- **Image Scanning**: Scan directories for images and generate embeddings for search
- **Similarity Search**: Find similar images using AI-powered vector search (embeddings generated on-demand)
- **Qdrant Integration**: Store and search image embeddings using Qdrant vector database
- **Directory Deletion**: When deleting a directory, all associated image records are also removed from the search database

## Directory Deletion

When you delete a directory from the Directory Manager, the system will:

1. **Scan for Associated Images**: Search through all Qdrant records to find images that belong to the deleted directory
2. **Remove Qdrant Records**: Delete all vector embeddings and metadata for images in that directory
3. **Clean Up Configuration**: Remove the directory configuration from the system

This ensures that when a directory is deleted, all traces of its images are removed from the search database, maintaining data consistency.

## API Endpoints

### Directory Management
- `GET /api/directories` - Get all directory configurations
- `POST /api/directories` - Add or update directory configuration
- `DELETE /api/directories/delete?id={id}` - Delete directory and all associated Qdrant records
- `POST /api/directories/scan` - Scan directory for images

### Image Management
- `GET /api/images` - Get all images
- `DELETE /api/images/delete?id={id}` - Delete specific image and its Qdrant record

### Search
- `POST /api/similarity-search` - Search for similar images

### Testing
- `GET /api/qdrant/test` - Test Qdrant connection
- `POST /api/qdrant/test` - Test directory deletion functionality

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Qdrant (make sure it's running on http://localhost:6333):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Images**: Drag and drop images for instant upload (no AI processing)
2. **Add Directories**: Use the Directory Manager to add directories containing images
3. **Scan Images**: Click "Scan" on a directory to process images and generate embeddings for search
4. **Search Images**: Use the similarity search to find similar images (embeddings generated on-demand)
5. **Delete Directories**: When deleting a directory, all associated image records are automatically removed from the search database

## Technical Details

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Vector Database**: Qdrant for storing and searching image embeddings
- **AI Model**: ResNet50 for generating image embeddings (on-demand during search and scanning)
- **Image Processing**: Sharp for image preprocessing
- **File System**: Node.js fs/promises for directory scanning
- **Performance**: Instant uploads with AI processing only when needed
