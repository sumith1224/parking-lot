# Parking Lot Management System

A NestJS-based parking lot management system that allows users to reserve parking spots, manage parking lots, and handle user accounts.

## Features

- List parking lots and spots
  - Query availability for a specific time window
  - Support multiple lot locations
  - Support multiple spot types (standard, compact, handicap, EV)
- Reserve a parking spot
  - Users can reserve contiguous time slots
  - Double-booking prevention
- Cancel reservations
  - Frees up spots immediately for other users
- View upcoming reservations
  - Retrieves lists per user, sorted by start time

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v15 or higher)
- Docker and Docker Compose (for containerized setup)

## Installation

### Without Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd parking-lot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=parking_lot
```

4. Start the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### With Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd parking-lot
```

2. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at `http://localhost:8080`

## Database Schema

### Entities and Relationships

1. **User**
   - Primary key: `id` (UUID)
   - Fields:
     - `email` (unique)
     - `password` (hashed)
     - `first_name`
     - `last_name`
     - `phone_number`
     - `created_at`
     - `updated_at`
   - Relationships:
     - One-to-Many with `Reservation`

2. **ParkingLot**
   - Primary key: `id` (UUID)
   - Fields:
     - `name`
     - `address`
     - `latitude`
     - `longitude`
     - `total_spots`
     - `created_at`
     - `updated_at`
   - Relationships:
     - One-to-Many with `ParkingSpot`

3. **ParkingSpot**
   - Primary key: `id` (UUID)
   - Fields:
     - `spot_number`
     - `type` (enum: STANDARD, HANDICAP, ELECTRIC, COMPACT)
     - `parking_lot_id` (foreign key)
     - `created_at`
     - `updated_at`
   - Relationships:
     - Many-to-One with `ParkingLot`
     - One-to-Many with `Reservation`

4. **Reservation**
   - Primary key: `id` (UUID)
   - Fields:
     - `start_time`
     - `end_time`
     - `status` (enum: CONFIRMED, CANCELLED, COMPLETED)
     - `user_id` (foreign key)
     - `parking_spot_id` (foreign key)
     - `created_at`
     - `updated_at`
   - Relationships:
     - Many-to-One with `User`
     - Many-to-One with `ParkingSpot`

## API Endpoints

### Users

- `POST /users` - Create a new user
- `GET /users/:id` - Get user details

### Parking Lots
- `POST /parking-lots` - Create a new parking lot
- `GET /parking-lots` - Get all parking lots
- `GET /parking-lots/:id` - Get parking lot details

### Parking Spots
- `POST /parking-spots` - Create a new parking spot
- `GET /parking-spots` - Get all parking spots
- `GET /parking-spots/types` - Get all spot types
- `GET /parking-spots/available` - Find available spots for a time window
- `GET /parking-spots/:id` - Get parking spot details

### Reservations
- `POST /reservations` - Create a new reservation
- `GET /reservations` - Get all reservations
- `GET /reservations/user/:userId` - Get reservations by user
- `GET /reservations/:id` - Get reservation details
- `DELETE /reservations/:id` - Cancel a reservation

## Development
