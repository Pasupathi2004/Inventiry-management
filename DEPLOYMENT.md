# Vercel + MongoDB Deployment Guide

## Prerequisites
- MongoDB Atlas account
- Vercel account
- GitHub repository

## Step 1: MongoDB Atlas Setup
1. Create MongoDB Atlas cluster
2. Configure database access
3. Set network access to allow all IPs
4. Get connection string

## Step 2: Vercel Deployment
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy

## Environment Variables Needed:
- MONGODB_URI
- JWT_SECRET
- NODE_ENV=production
- CORS_ORIGIN 