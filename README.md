# 🚀 Flowbit - Multi-tenant SaaS Platform

> **Status: ✅ FULLY OPERATIONAL** | **Tests: 24/24 Passing** | **All R1-R6 Requirements Complete**

A production-ready multi-tenant application demonstrating micro-frontend architecture, secure tenant data isolation, and automated workflow integration with n8n.

## ⚡ Quick Start

### Prerequisites
- **Docker Desktop** (4GB+ RAM)
- **Node.js 18+** and npm
- **Git**

### 🎯 Get Running in 3 Steps

```bash
# 1. Clone and install dependencies
git clone https://github.com/Shubhodippal/Flowbit.git
cd Flowbit
npm run install:all

# 2. Start all containers
npm run docker:up

# 3. Wait 90 seconds, then seed demo data
sleep 90 && npm run seed
```

**🌐 Open Application**: http://localhost:3000

### 🔐 Demo Accounts

| **Tenant** | **Email** | **Password** | **Role** |
|------------|-----------|--------------|----------|
| **LogisticsCo** | admin@logisticsco.com | password123 | Admin |
| **LogisticsCo** | user@logisticsco.com | password123 | User |
| **RetailGmbH** | admin@retailgmbh.com | password123 | Admin |
| **RetailGmbH** | user@retailgmbh.com | password123 | User |

### ✅ Verification

```bash
# Check all 5 containers are running
docker ps

# Run test suite
npm test

# Run integration test
node scripts/test-complete-integration.js
```

## 🏗️ System Architecture

```
                    Flowbit Multi-tenant SaaS Platform
                    ===================================

    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
    │   React Shell   │    │ Support Tickets  │    │      n8n        │
    │   (Port 3000)   │◄──►│ Micro-frontend   │    │   Workflow      │
    │                 │    │   (Port 3002)    │    │  (Port 5678)    │
    │ • Authentication│    │ • Ticket CRUD    │    │ • Automation    │
    │ • Navigation    │    │ • Module Fed     │    │ • Webhooks      │
    │ • Layout        │    │ • Independent    │    │ • Processing    │
    └─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
              │                      │                       │
              │              Module Federation               │
              │                      │                   Webhooks
              └──────────────────────┼───────────────────────┤
                                     │                       │
                        ┌────────────┴────────────┐         │
                        │      Express API        │◄────────┘
                        │     (Port 3001)         │
                        │                         │
                        │ • JWT Access/Refresh Tokens │
                        │ • Tenant Isolation      │
                        │ • RBAC Middleware       │
                        │ • Audit Logging         │
                        │ • n8n Integration       │
                        │ • Webhook Security      │
                        └────────────┬────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │      MongoDB            │
                        │     (Port 27017)        │
                        │                         │
                        │ • Users (tenant-aware)  │
                        │ • Tickets (isolated)    │
                        │ • Audit Logs            │
                        │ • Persistent Storage    │
                        └─────────────────────────┘

    Data Flow:
    1. User logs in → JWT token with tenant context
    2. Create ticket → Saved to MongoDB → Triggers n8n workflow  
    3. n8n processes → Webhook callback → Updates ticket status
    4. Frontend polls → Real-time UI updates
```

## 🎯 Core Features Implemented

### 🔐 **Multi-tenant Data Isolation**
- **JWT tokens** include tenant context (`customerId`)
- **Database queries** automatically filtered by tenant
- **Zero data leakage** between tenants verified by testing
- **Comprehensive test coverage**: 24/24 tests passing ✅

### 🎫 **Support Ticket Management** 
- **Full CRUD operations** with validation and error handling
- **Status workflow**: `open → in-progress → resolved → closed → escalated`
- **Priority levels**: `low, medium, high, critical`
- **Comments system** and complete audit trail
- **Real-time updates** via polling (WebSocket ready)

### ⚡ **n8n Workflow Integration**
- **Automated ticket processing** triggered on ticket creation
- **Webhook callbacks** with shared secret validation (`flowbit-secret-2024`)
- **Real-time status updates** back to the ticket system
- **Graceful error handling** (system works even when n8n is unavailable)
- **Security validation** prevents unauthorized webhook calls

### 🧩 **Micro-frontend Architecture**
- **Webpack Module Federation** for independent deployments
- **Dynamic loading** of support tickets app from separate container
- **Shared authentication context** across all micro-frontends
- **Independent deployment** capability for each service

### 🛡️ **Enterprise Security & Authentication**
- **Access/Refresh Token System**: 15-minute access tokens with 7-day refresh tokens
- **Automatic token refresh**: Seamless user experience with background token renewal
- **Multi-device sessions**: Users can stay logged in across multiple devices
- **Role-based access control (RBAC)**: Admin vs User permissions
- **Secure token storage**: Refresh tokens stored in MongoDB with automatic cleanup
- **Protected routes** with comprehensive middleware
- **Rate limiting** and input validation
- **Security headers** and CORS configuration
- **Webhook secret validation** for n8n integration

### 💾 **Production-Ready Data Persistence**
- **MongoDB** with persistent Docker volumes
- **Data survives** container restarts and updates
- **Proper database indexes** for optimal performance
- **Backup/restore scripts** included for data management
- **Connection pooling** and error recovery

## ⚠️ Known Limitations

### Technical Constraints
- **n8n Workflow**: Fixed 5-second processing delay, limited error handling
- **Frontend**: Basic responsive design, minimal accessibility features  
- **Scalability**: Single MongoDB instance, no clustering or load balancing
- **Testing**: Integration tests require manual tenant setup, limited edge case coverage

### Platform Dependencies
- **Docker Required**: All components containerized, no standalone deployment option
- **Port Conflicts**: Uses fixed ports (3000-3002, 5678, 27017) - may conflict with existing services
- **Network**: Containers must communicate on same Docker network

### Data Management
- **Backup**: Manual backup scripts provided, no automated backup system
- **Migration**: No database migration system implemented yet
---
