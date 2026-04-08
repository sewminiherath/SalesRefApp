# E-Billing System

Mobile/Tablet-optimized billing system for sales agents. Connects to the main Stock Management System backend.

## Features

- ✅ **Mobile/Tablet Optimized** - Touch-friendly interface
- ✅ **Real-time Stock Updates** - Automatically syncs with main system
- ✅ **Client Search** - Quick client lookup
- ✅ **Item Search** - Find items with stock availability
- ✅ **Percentage Discount** - Easy discount calculation
- ✅ **Invoice Management** - Create and view invoices
- ✅ **Offline Capable** - Works with backend API

## Connection

The E-Billing system connects to the **Express API** (`npm run backend`):
- Default local URL: `http://localhost:5000/api` (or your PC's IP on the LAN)
- When invoices are created, stock is updated in the SQLite database used by that API

### Vercel (production frontend)

Production app: **[ebilling-system.vercel.app](https://ebilling-system.vercel.app/)**

The Next.js app on Vercel **does not** run the Express server or SQLite. You must:

1. Host the API somewhere with a **public HTTPS URL** (e.g. Railway, Render, Fly.io, VPS).
2. In the Vercel project → **Settings → Environment Variables**, set:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API-HOST/api` (must match where Express serves `/api/...`).
3. **Redeploy** so the new value is baked into the client bundle.

Without this, the browser still calls `localhost` and login will fail on phones and on the live site.

## Installation

### Step 1: Install Dependencies

```bash
cd E-BILLING
npm install
```

### Step 2: Configure Backend URL

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://YOUR_PC_IP:5000/api
```

**For same device:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**For tablet on network:**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000/api
```
(Replace with your PC's IP address)

### Step 3: Start the Application

```bash
npm run dev
```

The E-Billing system will run on `http://localhost:3001`

## Access from Tablet

1. **Find your PC's IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Update `.env.local`** with PC's IP:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:5000/api
   ```

3. **Access from tablet browser:**
   - `http://YOUR_PC_IP:3001`
   - Or use the PC's hostname if available

## Usage

1. **Login** with sales agent credentials
2. **Create Invoice:**
   - Search and select client
   - Search and add items
   - Set discount percentage
   - Set tax rate
   - Create invoice
3. **View Invoices:**
   - Browse all created invoices
   - View invoice details

## Stock Updates

When a sales agent creates an invoice:
1. ✅ Stock is automatically reduced in the main system
2. ✅ Main system dashboard updates in real-time
3. ✅ Stock levels sync across all devices

## Requirements

- Node.js v18+
- Backend server running (from main Stock Management System)
- Network access between tablet and PC

## Troubleshooting

### Cannot connect to backend
- Check backend is running on PC
- Verify IP address in `.env.local`
- Check firewall settings
- Ensure both devices on same network

### Stock not updating
- Verify backend connection
- Check backend logs for errors
- Ensure invoice creation succeeded

## Default Login

Same as main system:
- Username: `admin`
- Password: `admin123`
