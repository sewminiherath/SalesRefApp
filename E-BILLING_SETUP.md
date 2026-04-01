# E-Billing System Setup Guide

## Overview

The E-Billing System is a tablet-optimized application that connects to the main Stock Management System backend. When sales agents create invoices, the stock is automatically updated in the main system.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Tablet/Device │  ────>  │  E-Billing App   │  ────>  │  Backend API    │
│  (Sales Agent)  │         │  (Port 3001)      │         │  (Port 5000)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                                                    │
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │ Stock Database  │
                                                          │  (SQLite)       │
                                                          └─────────────────┘
                                                                    │
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │ Main System PC  │
                                                          │ (Auto-updated)  │
                                                          └─────────────────┘
```

## Installation

### Step 1: Install Dependencies

```bash
cd E-BILLING
npm install
```

### Step 2: Configure Backend Connection

Edit `.env.local`:

**For same device (testing):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**For tablet on network:**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000/api
```
(Replace with your PC's IP address where backend is running)

### Step 3: Start E-Billing System

```bash
npm run dev
```

The E-Billing system will run on `http://localhost:3001`

## Access from Tablet

### Option 1: Same Network

1. **Find PC's IP address:**
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
   - `http://192.168.1.100:3001`
   - Or bookmark it for quick access

### Option 2: Add to Home Screen (PWA-like)

1. Open the E-Billing URL in tablet browser
2. Use browser's "Add to Home Screen" option
3. It will work like a native app

## Features

### ✅ Invoice Creation
- Search and select clients
- Search and add items with stock availability
- Real-time stock checking
- Percentage discount (0-100%)
- Tax calculation
- Date selection
- Automatic stock reduction

### ✅ Invoice Management
- View all invoices
- Search invoices
- View invoice details
- Invoice status tracking

### ✅ Real-time Sync
- Stock updates automatically
- Main system sees changes immediately
- No manual sync needed

## Workflow

1. **Sales Agent opens E-Billing on tablet**
2. **Logs in** with credentials
3. **Creates Invoice:**
   - Selects client
   - Adds items (system checks stock)
   - Sets discount percentage
   - Sets tax rate
   - Creates invoice
4. **Stock automatically updates** in main system
5. **Main system admin** sees updated stock levels

## Network Configuration

### Backend (PC) - Allow Network Access

The backend already has CORS enabled, but ensure:

1. **Firewall Settings:**
   - Allow port 5000 (backend)
   - Allow port 3001 (e-billing, if running on PC)

2. **Backend should be accessible:**
   - Check: `http://YOUR_PC_IP:5000/health` from tablet

### E-Billing (Tablet)

1. **Ensure tablet and PC are on same network**
2. **Update `.env.local`** with correct IP
3. **Restart E-Billing** after changing IP

## Testing

### Test Connection

1. **From tablet browser:**
   - Visit: `http://YOUR_PC_IP:5000/health`
   - Should see: `{"status":"ok",...}`

2. **Login to E-Billing:**
   - Visit: `http://YOUR_PC_IP:3001`
   - Login with: `admin` / `admin123`

3. **Create test invoice:**
   - Select client
   - Add item
   - Create invoice
   - Check main system - stock should be reduced!

## Troubleshooting

### Cannot connect to backend
- Verify backend is running on PC
- Check IP address in `.env.local`
- Ensure both devices on same network
- Check firewall settings
- Test: `http://PC_IP:5000/health` from tablet

### Stock not updating
- Verify invoice was created successfully
- Check backend logs for errors
- Ensure backend database is accessible
- Verify CORS is enabled (already configured)

### E-Billing won't start
- Check Node.js is installed
- Verify dependencies: `npm install`
- Check port 3001 is available
- Review console for errors

## Security Notes

- ✅ Uses same authentication as main system
- ✅ JWT tokens for secure API access
- ✅ All API calls are authenticated
- ⚠️ For production, use HTTPS
- ⚠️ Change default passwords

## Production Deployment

For production:

1. **Use HTTPS** for both systems
2. **Set up proper domain/IP**
3. **Configure firewall rules**
4. **Use environment variables** for sensitive data
5. **Enable rate limiting** on backend

## Summary

The E-Billing system is a separate application that:
- ✅ Runs on tablet/another device
- ✅ Connects to main backend API
- ✅ Automatically updates stock when invoices are created
- ✅ Provides mobile-friendly interface for sales agents
- ✅ Syncs in real-time with main system

Both systems work together seamlessly!

