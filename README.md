# Flowbit - Multi-tenant Application with n8n Integration

A comprehensive multi-tenant application demonstrating micro-frontend architecture, tenant data isolation, and workflow automation integration.

## 🎯 Project Overview

This project implements a complete multi-tenant SaaS platform featuring:
- **Tenant-aware authentication & RBAC** with JWT
- **Strict data isolation** between tenants
- **Micro-frontend architecture** with Module Federation
- **n8n workflow integration** for automated processes
- **RESTful API** with comprehensive security
- **Containerized deployment** with Docker

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Shell   │    │ Support Tickets  │    │      n8n        │
│   (Port 3000)   │    │ Micro-frontend   │    │  Workflow       │
│                 │    │   (Port 3002)    │    │  (Port 5678)    │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      Express API        │
                    │     (Port 3001)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      MongoDB            │
                    │     (Port 27017)        │
                    └─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

### 1. Clone and Setup

```powershell
# Clone the repository
git clone <your-repo-url>
cd Flowbit

# Install dependencies for all modules
npm run install:all
```

### 2. Environment Configuration

```powershell
# Copy environment file
cp api\.env.example api\.env

# Edit api\.env if needed (defaults should work for local development)
```

### 3. Start with Docker (Recommended)

```powershell
# Start all services
npm run docker:up

# Wait for all containers to be ready (30-60 seconds)
# Then seed the database
npm run seed
```

### 4. Alternative: Local Development

If Docker isn't working:

```powershell
# Start MongoDB (install locally or use cloud MongoDB)
# Update MONGODB_URI in api\.env

# Install dependencies
npm run install:all

# Start all services in development mode
npm run dev

# In another terminal, seed the database
npm run seed
```

## 🧪 Testing the Application

### Demo Accounts

| Tenant | Email | Password | Role |
|--------|-------|----------|------|
| LogisticsCo | admin@logisticsco.com | password123 | Admin |
| LogisticsCo | user@logisticsco.com | password123 | User |
| RetailGmbH | admin@retailgmbh.com | password123 | Admin |
| RetailGmbH | user@retailgmbh.com | password123 | User |

### Test Scenarios

1. **Login & Tenant Isolation**
   - Login as LogisticsCo admin
   - Create a ticket and note the ticket ID
   - Logout and login as RetailGmbH admin
   - Verify you cannot see LogisticsCo's tickets

2. **Micro-frontend Loading**
   - Navigate to Support Tickets
   - Verify the micro-frontend loads properly
   - Test CRUD operations on tickets

3. **n8n Workflow Integration**
   - Create a new ticket
   - Check the ticket status for workflow updates
   - Monitor n8n dashboard at http://localhost:5678

4. **RBAC Testing**
   - Login as User role
   - Verify appropriate access restrictions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Tickets
- `GET /api/tickets` - List tickets (tenant-filtered)
- `POST /api/tickets` - Create ticket (triggers n8n workflow)
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Users
- `GET /api/users/me` - Get user profile
- `GET /api/users/me/screens` - Get user's allowed screens
- `GET /api/users` - List users (Admin only, tenant-filtered)

### Webhooks
- `POST /webhook/ticket-done` - n8n callback webhook

## 🧪 Running Tests

```powershell
# Run API tests (including tenant isolation tests)
cd api
npm test

# Run specific tenant isolation test
npm test -- --testNamePattern="Tenant Isolation"
```

## 📊 Key Features Demonstrated

### ✅ R1: Auth & RBAC
- JWT-based authentication with bcrypt password hashing
- Role-based access control (Admin/User)
- Middleware protection for admin routes

### ✅ R2: Tenant Data Isolation
- Every MongoDB collection includes `customerId`
- Middleware enforces tenant filtering on all queries
- Jest tests prove cross-tenant data isolation

### ✅ R3: Use-Case Registry
- Hard-coded tenant configuration in `registry.json`
- `/api/users/me/screens` endpoint returns tenant-specific screens
- Dynamic screen loading based on tenant

### ✅ R4: Dynamic Navigation
- React shell fetches screens from API
- Sidebar renders dynamically based on tenant
- Module Federation loads Support Tickets micro-frontend

### ✅ R5: Workflow Integration
- n8n container configured in docker-compose
- POST `/api/tickets` triggers n8n workflow
- Webhook callback updates ticket status
- Shared secret verification for webhook security

### ✅ R6: Containerized Development
- Complete docker-compose setup
- Self-configuring containers
- No manual configuration steps required

## 🎁 Bonus Features

### ✅ Audit Logging
- Comprehensive audit trail for all ticket operations
- Tracks user actions, IP addresses, and timestamps
- Tenant-isolated audit logs

### ✅ Security Features
- Helmet.js security headers
- Rate limiting
- CORS configuration
- Input validation with Joi
- SQL injection prevention with Mongoose

### ✅ Modern UI/UX
- Material-UI components
- Responsive design
- Loading states and error handling
- Real-time status updates

## 🐛 Troubleshooting

### Docker Issues
```powershell
# Check container status
docker-compose ps

# View logs
docker-compose logs api
docker-compose logs shell
docker-compose logs n8n

# Restart services
docker-compose restart
```

### Port Conflicts
- Shell: http://localhost:3000
- API: http://localhost:3001  
- Support Tickets: http://localhost:3002
- n8n: http://localhost:5678
- MongoDB: localhost:27017

### Database Connection
```powershell
# Check MongoDB connection
docker-compose logs mongodb

# Connect to MongoDB directly
docker exec -it flowbit-mongodb mongosh
```

## 📝 Development Notes

### Project Structure
```
Flowbit/
├── api/                    # Express.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth & audit middleware
│   └── services/          # n8n & webhook services
├── shell/                 # React main application
│   ├── src/components/    # React components
│   ├── src/contexts/      # Auth context
│   └── src/pages/         # Application pages
├── support-tickets-app/   # Micro-frontend
└── scripts/               # Database seeding
```

### Key Technologies
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React 18, Material-UI, Module Federation
- **Security**: JWT, bcrypt, Helmet.js, Joi validation
- **DevOps**: Docker, docker-compose
- **Workflow**: n8n automation platform

## 🎬 Demo Video Checklist

For your submission video, demonstrate:

1. ✅ **Login as both tenants** (LogisticsCo & RetailGmbH)
2. ✅ **Create tickets** in both tenants
3. ✅ **Show tenant isolation** (each tenant sees only their data)
4. ✅ **Micro-frontend loading** (Support Tickets app)
5. ✅ **n8n workflow trigger** (ticket creation → workflow → status update)
6. ✅ **RBAC demonstration** (Admin vs User access)

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review container logs
3. Ensure all ports are available
4. Verify MongoDB connection

## 🎯 Submission Requirements Met

- ✅ Git repository with complete source code
- ✅ Docker-compose setup for all services
- ✅ Seed script with demo tenants
- ✅ Comprehensive README with architecture diagram
- ✅ Working demo showing all required features
- ✅ Jest tests proving tenant isolation
- ✅ All core requirements (R1-R6) implemented
- ✅ Bonus features included

---

**Ready for submission to soham.shah@flowbitai.com** 🚀
