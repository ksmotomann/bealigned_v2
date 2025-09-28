#!/bin/bash

# BeAligned Local Development Setup Script

echo "BeAligned Local Development Setup"
echo "================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI is installed"

# Start local Supabase
echo ""
echo "Starting local Supabase services..."
echo "This may take a few minutes on first run..."
echo ""

supabase start

# Get the local credentials
echo ""
echo "================================================"
echo "Local Supabase is running!"
echo "================================================"
echo ""
echo "Save these credentials to your .env.local file:"
echo ""
echo "Frontend (.env.local):"
echo "REACT_APP_SUPABASE_URL=http://localhost:54321"
echo "REACT_APP_SUPABASE_ANON_KEY=<copy from above output>"
echo ""
echo "Studio URL: http://localhost:54323"
echo "Inbucket (Email testing): http://localhost:54324"
echo ""
echo "To stop local Supabase: supabase stop"
echo "================================================"