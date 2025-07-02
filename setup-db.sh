#!/bin/bash

# Database setup script for the boilerplate

echo "🔧 Setting up database for fullstack boilerplate..."

# Load environment variables from backend/.env
if [ -f "backend/.env" ]; then
    echo "📄 Loading configuration from backend/.env..."
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "⚠️  No backend/.env file found, using defaults..."
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

# Extract database name from DATABASE_URL or use default
if [ -n "$DATABASE_URL" ]; then
    # Extract database name from DATABASE_URL (assumes format: postgres://user:pass@host:port/dbname)
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*://[^/]*/\([^?]*\).*|\1|p')
else
    DB_NAME="boilerplate"
fi

echo "🎯 Target database: $DB_NAME"
DB_EXISTS=$(psql -lqt | cut -d \| -f 1 | grep -w $DB_NAME)

if [ -z "$DB_EXISTS" ]; then
    echo "📝 Creating database '$DB_NAME'..."
    createdb $DB_NAME
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database. Make sure PostgreSQL is running."
        exit 1
    fi
else
    echo "✅ Database '$DB_NAME' already exists"
fi

# Test connection
echo "🔍 Testing database connection..."
if psql -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Could not connect to database"
    exit 1
fi

echo "🎉 Database setup complete!"
echo "💡 You can now run: bun run dev"
