#!/bin/bash

# Load environment variables
source .env

# 1. Define URLs
LOCAL_DB_URL="$DATABASE_URL_DEV"
# logic to default to DATABASE_URL if PROD generic var isn't set, but we know it is DATABASE_URL in your env
PROD_DB_URL="$DATABASE_URL" 

echo "⚠️  WARNING: You are about to copy data from LOCAL to PRODUCTION."
echo "   Local: $LOCAL_DB_URL"
echo "   Prod:  $PROD_DB_URL"
echo ""
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

# 3. Dump and Restore (Schema + Data)
echo "---------------------------------------"
echo "2. CLONING Database (Local -> Prod)..."
echo "---------------------------------------"

# We use Custom Format (-Fc) which allows pg_restore to handle reordering and cleaning
# --clean: Drops existing objects in Prod before creating new ones (Fixes schema mismatches)
# --no-owner --no-acl: Prevents permission errors on AWS RDS
pg_dump "$CLEAN_LOCAL_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --exclude-table=_prisma_migrations \
| pg_restore --clean --if-exists --no-owner --no-acl --dbname "$CLEAN_PROD_URL"

echo ""
echo "✅ Done! Database cloned successfully."
