#!/bin/bash
echo "Building and deploying BudgetBuddy to Heroku..."

# Ensure Spring Security is disabled for Heroku profile
echo "Adding security.basic.enabled=false to application-heroku.properties"
echo "security.basic.enabled=false" >> src/main/resources/application-heroku.properties
echo "spring.main.allow-bean-definition-overriding=true" >> src/main/resources/application-heroku.properties

# Set up SendGrid add-on and configure API key
echo "Setting up SendGrid add-on in Heroku..."
heroku addons:create sendgrid:essential --app budgetbuddy-app2 || echo "SendGrid add-on may already exist, continuing..."

# Set up Redis add-on
echo "Checking Redis add-on..."
if heroku addons --app budgetbuddy-app2 | grep -q redis; then
    echo "Redis add-on already exists, skipping creation..."
    # Get the existing Redis add-on name
    REDIS_ADDON=$(heroku addons --app budgetbuddy-app2 | grep redis | awk '{print $1}' | head -1)
    echo "Using existing Redis add-on: $REDIS_ADDON"
else
    echo "Setting up Redis add-on in Heroku..."
    heroku addons:create heroku-redis:mini --app budgetbuddy-app2
    # Get the newly created Redis add-on name
    REDIS_ADDON=$(heroku addons --app budgetbuddy-app2 | grep redis | awk '{print $1}' | head -1)
    echo "Waiting for Redis to be provisioned..."
    sleep 15
fi

# Verify Redis add-on
echo "Verifying Redis add-on..."
if [ -n "$REDIS_ADDON" ]; then
    heroku addons:info $REDIS_ADDON --app budgetbuddy-app2
else
    echo "Could not determine Redis add-on name"
fi

# Build Docker image
echo "Building Docker image..."
docker build -f heroku_deploy/Dockerfile -t registry.heroku.com/budgetbuddy-app2/web .

# Push to Heroku
echo "Pushing to Heroku Container Registry..."
docker push registry.heroku.com/budgetbuddy-app2/web

# Release the container
echo "Releasing the container..."
heroku container:release web --app budgetbuddy-app2

# Check Redis connection
echo "Verifying Redis connection..."
heroku redis:info --app budgetbuddy-app2

# Display Redis stats
echo "Redis statistics:"
heroku redis:stats --app budgetbuddy-app2

echo "Deployment complete. View the application at: https://budgetbuddy-app2-30f69a583595.herokuapp.com/"
echo "To view logs, run: heroku logs --tail --app budgetbuddy-app2"