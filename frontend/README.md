# Product Management Frontend

React-based frontend for the Product Management System.

## Features

- **Product CRUD**: Create, read, update, and delete products
- **CSV Import**: Bulk import products with progress tracking
- **Real-time Notifications**: Server-Sent Events (SSE) for live updates
- **Low Stock Alerts**: Visual indicators for products with quantity < 10
- **Simple Authentication**: X-Seller-Id header-based authentication

## Tech Stack

- React 18 with TypeScript
- Axios for API calls
- Vite for build tooling
- Vanilla CSS (no component library)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:3001

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

Edit `.env` if you need to change any configuration values.

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ProductsTable.tsx    # Main products dashboard
│   │   ├── ProductModal.tsx     # Create/Edit product modal
│   │   ├── NotificationsPanel.tsx  # Real-time notifications sidebar
│   │   ├── ImportPage.tsx       # CSV import page
│   │   └── Toast.tsx            # Toast notifications
│   ├── services/
│   │   └── api.ts               # API service layer
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── styles.css               # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Usage

### Login

1. Enter any Seller ID (e.g., `seller-123`)
2. The ID is stored in localStorage for subsequent requests

### Products Dashboard

- View all products in a table
- Filter by category
- Sort by name, price, quantity, or date
- Create new products with "Add Product" button
- Edit existing products with "Edit" button
- Delete products with "Delete" button (confirmation required)
- Low stock products (quantity < 10) are highlighted

### CSV Import

1. Navigate to "Import CSV" tab
2. Upload a CSV file with the following format:
   ```csv
   name,description,price,quantity,category
   iPhone 15,Latest smartphone,999.99,100,Electronics
   MacBook Pro,16-inch laptop,2499.99,50,Electronics
   ```
3. Track upload progress
4. Receive real-time notifications as products are created

### Notifications

- Real-time notifications appear in the right sidebar
- Types of notifications:
  - Product Created (green)
  - Product Updated (blue)
  - Product Deleted (red)
  - Low Stock Warning (yellow)
- Connection status indicator shows live/disconnected state
- Clear all notifications with "Clear All" button

## API Integration

The frontend communicates with the backend API at `/api` (proxied to http://localhost:3001/api in development).

All requests include the `X-Seller-Id` header for authentication.

### Endpoints Used

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/import` - Import CSV
- `GET /api/events/stream` - SSE connection for real-time notifications

## Configuration

### Environment Variables

The application uses environment variables for configuration. See `.env.example` for all available options.

Key variables:
- `VITE_API_BASE_URL` - API base URL (default: `/api`)
- `VITE_BACKEND_URL` - Backend server URL (default: `http://localhost:3001`)
- `VITE_DEFAULT_PAGE_SIZE` - Items per page (default: `20`)
- `VITE_MAX_FILE_SIZE_MB` - Max CSV file size (default: `10`)

Configuration files:
- `.env` - Default configuration
- `.env.development` - Development overrides
- `.env.production` - Production overrides
- `.env.example` - Template (copy this to `.env`)

### API Proxy

The dev server proxies API requests to the backend:

```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

## Notes

- This is a demo application with simplified authentication
- SSE connection automatically reconnects on disconnect
- File uploads are limited to 10MB
- CSV imports support up to 10,000 rows
- The UI is intentionally minimal and functional for demo purposes
