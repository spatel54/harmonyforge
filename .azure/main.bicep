// ── HarmonyForge — Azure Container Apps Infrastructure ──────────────────────
// Deploy with:
//   az deployment group create \
//     --resource-group harmonyforge-rg \
//     --template-file .azure/main.bicep \
//     --parameters @.azure/parameters.json
// ─────────────────────────────────────────────────────────────────────────────

@description('Azure region for all resources')
param location string = 'eastus'

@description('Name of the Azure Container Registry')
param acrName string = 'harmonyforgeacr'

@description('Container Apps Environment name')
param environmentName string = 'harmonyforge-env'

@description('Image tag to deploy (e.g. git SHA)')
param imageTag string = 'latest'

@description('OpenAI API Key for Theory Inspector — injected as a secret')
@secure()
param openAiApiKey string

@description('OpenAI model override')
param openAiModel string = 'gpt-4o-mini'

// ── Azure Container Registry ─────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false   // Using managed identity — no admin password needed
  }
}

// ── Log Analytics Workspace (required by Container Apps Environment) ──────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'harmonyforge-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Container Apps Environment ────────────────────────────────────────────────
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── User-Assigned Managed Identity (for ACR pull) ─────────────────────────────
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'harmonyforge-identity'
  location: location
}

// Grant AcrPull role to the managed identity on the registry
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d'  // AcrPull built-in role
    )
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Backend Container App ─────────────────────────────────────────────────────
resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'harmonyforge-backend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: false           // Internal only — only frontend can reach backend
        targetPort: 8000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/harmonyforge-backend:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 30
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
  dependsOn: [acrPullRoleAssignment]
}

// ── Frontend Container App ────────────────────────────────────────────────────
resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'harmonyforge-frontend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true            // Public HTTPS endpoint
        targetPort: 3000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        {
          name: 'openai-api-key'
          value: openAiApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/harmonyforge-frontend:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'OPENAI_API_KEY', secretRef: 'openai-api-key' }
            { name: 'OPENAI_MODEL', value: openAiModel }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 15
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
  dependsOn: [backendApp, acrPullRoleAssignment]
}

// ── Outputs ───────────────────────────────────────────────────────────────────
@description('Login server for the Azure Container Registry')
output acrLoginServer string = acr.properties.loginServer

@description('Public HTTPS URL for the HarmonyForge frontend')
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'

@description('Internal FQDN for the backend (used as NEXT_PUBLIC_API_URL)')
output backendInternalFqdn string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
