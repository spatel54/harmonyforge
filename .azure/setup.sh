#!/usr/bin/env bash
# =============================================================================
# HarmonyForge — Azure One-Time Setup Script
# Run this ONCE from your local machine to provision Azure prerequisites.
#
# Prerequisites:
#   - Azure CLI installed:  brew install azure-cli
#   - az login completed:  az login
#   - GitHub CLI installed: brew install gh
#   - gh auth login completed
#
# Usage:
#   chmod +x .azure/setup.sh
#   SUBSCRIPTION_ID=<your-id> GITHUB_REPO=spatel54/harmonyforge .azure/setup.sh
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:?'Set SUBSCRIPTION_ID env var'}"
GITHUB_REPO="${GITHUB_REPO:?'Set GITHUB_REPO env var, e.g. spatel54/harmonyforge'}"
RESOURCE_GROUP="harmonyforge-rg"
LOCATION="eastus"
ACR_NAME="harmonyforgeacr"
SP_NAME="harmonyforge-github-oidc"
KV_NAME="harmonyforge-kv"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  HarmonyForge Azure Setup"
echo "  Subscription: $SUBSCRIPTION_ID"
echo "  GitHub Repo:  $GITHUB_REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Set active subscription ────────────────────────────────────────────────
echo "→ Setting active subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

# ── 2. Create Resource Group ──────────────────────────────────────────────────
echo "→ Creating resource group: $RESOURCE_GROUP..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

# ── 3. Create Azure Container Registry ───────────────────────────────────────
echo "→ Creating Azure Container Registry: $ACR_NAME..."
az acr create \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Basic \
  --admin-enabled false \
  --output none

# ── 4. Create Service Principal for GitHub Actions (OIDC) ────────────────────
echo "→ Creating Service Principal: $SP_NAME..."
SP_JSON=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --json-auth \
  --output json)

CLIENT_ID=$(echo "$SP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['clientId'])")
TENANT_ID=$(echo "$SP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tenantId'])")

# ── 5. Add OIDC Federated Credential for GitHub Actions ───────────────────────
echo "→ Adding OIDC federated credential for GitHub Actions..."
az ad app federated-credential create \
  --id "$CLIENT_ID" \
  --parameters "{
    \"name\": \"harmonyforge-github-deploy\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:ref:refs/heads/main\",
    \"description\": \"HarmonyForge GitHub Actions deploy\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" \
  --output none

# ── 6. Grant AcrPush to Service Principal ────────────────────────────────────
echo "→ Granting AcrPush role to Service Principal..."
ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id --output tsv)
az role assignment create \
  --assignee "$CLIENT_ID" \
  --role AcrPush \
  --scope "$ACR_ID" \
  --output none

# ── 7. Create Key Vault for secrets ──────────────────────────────────────────
echo "→ Creating Key Vault: $KV_NAME..."
az keyvault create \
  --name "$KV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

echo ""
echo "  Enter your OpenAI API Key to store in Key Vault."
read -r -s -p "  OPENAI_API_KEY: " OPENAI_KEY
echo ""

az keyvault secret set \
  --vault-name "$KV_NAME" \
  --name "openai-api-key" \
  --value "$OPENAI_KEY" \
  --output none

echo "→ OpenAI key stored in Key Vault ✅"

# ── 8. Install GitHub Secrets ─────────────────────────────────────────────────
echo "→ Setting GitHub Actions secrets on $GITHUB_REPO..."
gh secret set AZURE_CLIENT_ID        --repo "$GITHUB_REPO" --body "$CLIENT_ID"
gh secret set AZURE_TENANT_ID        --repo "$GITHUB_REPO" --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID  --repo "$GITHUB_REPO" --body "$SUBSCRIPTION_ID"
gh secret set AZURE_ACR_NAME         --repo "$GITHUB_REPO" --body "$ACR_NAME"

# OPENAI_API_KEY is also needed as a GitHub secret for the Docker build arg
gh secret set OPENAI_API_KEY         --repo "$GITHUB_REPO" --body "$OPENAI_KEY"

# ── 9. Set GitHub Variables ───────────────────────────────────────────────────
echo "→ Setting GitHub Actions variables..."
gh variable set AZURE_RESOURCE_GROUP --repo "$GITHUB_REPO" --body "$RESOURCE_GROUP"
gh variable set AZURE_LOCATION       --repo "$GITHUB_REPO" --body "$LOCATION"

# ── 10. Update parameters.json with real subscription ID ─────────────────────
echo "→ Patching .azure/parameters.json with subscription ID..."
sed -i '' "s/YOUR_SUBSCRIPTION_ID/$SUBSCRIPTION_ID/g" \
  "$(dirname "$0")"/parameters.json

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Azure Setup Complete!"
echo ""
echo "  Client ID (AZURE_CLIENT_ID):       $CLIENT_ID"
echo "  Tenant ID (AZURE_TENANT_ID):       $TENANT_ID"
echo "  Subscription (AZURE_SUBSCRIPTION): $SUBSCRIPTION_ID"
echo "  ACR Name:                          $ACR_NAME"
echo "  Key Vault:                         $KV_NAME"
echo ""
echo "  Next steps:"
echo "  1. Push to main → GitHub Action will deploy both services."
echo "  2. After first deploy, set AZURE_BACKEND_URL variable:"
echo "     gh variable set AZURE_BACKEND_URL --repo $GITHUB_REPO \\"
echo "       --body \"https://<backend-fqdn>\""
echo "  3. Push again → frontend will bake the real backend URL."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
