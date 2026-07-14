import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoContentsUrl =
  'https://api.github.com/repos/arvigeus/AZ-204/contents/Questions?ref=master';
const outputPath = path.join(process.cwd(), 'src', 'data', 'source-quiz.generated.json');
const verifiedAt = new Date().toISOString().slice(0, 10);

const topicMap = {
  'API Management': {
    chapterId: 'integration',
    subchapterId: 'api-management',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts',
      'https://learn.microsoft.com/en-us/azure/api-management/api-management-policies'
    ]
  },
  'AZ CLI': {
    chapterId: 'compute',
    subchapterId: 'app-service',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/cli/azure/',
      'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-204'
    ]
  },
  'App Configuration': {
    chapterId: 'security',
    subchapterId: 'secure-solutions',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/azure-app-configuration/overview']
  },
  'App Service': {
    chapterId: 'compute',
    subchapterId: 'app-service',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/app-service/overview',
      'https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots'
    ]
  },
  'Application Insights': {
    chapterId: 'monitoring',
    subchapterId: 'app-insights',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview']
  },
  Azure: {
    chapterId: 'compute',
    subchapterId: 'app-service',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/architecture/guide/']
  },
  'Blob Storage': {
    chapterId: 'storage',
    subchapterId: 'blob-storage',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction',
      'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-properties-metadata'
    ]
  },
  'Compute Solutions': {
    chapterId: 'compute',
    subchapterId: 'containers',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/container-apps/overview',
      'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview'
    ]
  },
  Containers: {
    chapterId: 'compute',
    subchapterId: 'containers',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/container-registry/',
      'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview',
      'https://learn.microsoft.com/en-us/azure/container-apps/overview'
    ]
  },
  'Cosmos DB': {
    chapterId: 'storage',
    subchapterId: 'cosmos-db',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/cosmos-db/introduction',
      'https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits',
      'https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/query/'
    ]
  },
  Docker: {
    chapterId: 'compute',
    subchapterId: 'containers',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-quick-task'
    ]
  },
  'Entra ID': {
    chapterId: 'security',
    subchapterId: 'auth',
    sourceUrls: ['https://learn.microsoft.com/en-us/entra/identity-platform/v2-overview']
  },
  'Event Grid': {
    chapterId: 'integration',
    subchapterId: 'events',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/event-grid/overview']
  },
  'Event Hubs': {
    chapterId: 'integration',
    subchapterId: 'events',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about']
  },
  Functions: {
    chapterId: 'compute',
    subchapterId: 'functions',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview',
      'https://learn.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings'
    ]
  },
  Graph: {
    chapterId: 'security',
    subchapterId: 'auth',
    sourceUrls: ['https://learn.microsoft.com/en-us/graph/overview']
  },
  'Key Vault': {
    chapterId: 'security',
    subchapterId: 'secure-solutions',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/key-vault/general/overview']
  },
  'Managed Identities': {
    chapterId: 'security',
    subchapterId: 'secure-solutions',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview'
    ]
  },
  'Message Queues': {
    chapterId: 'integration',
    subchapterId: 'messages',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview',
      'https://learn.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction'
    ]
  },
  Monitor: {
    chapterId: 'monitoring',
    subchapterId: 'app-insights',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
      'https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview'
    ]
  },
  'Queue Storage': {
    chapterId: 'integration',
    subchapterId: 'messages',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction'
    ]
  },
  'Resource Groups': {
    chapterId: 'compute',
    subchapterId: 'app-service',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal'
    ]
  },
  'Service Bus': {
    chapterId: 'integration',
    subchapterId: 'messages',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview'
    ]
  },
  'Shared Access Signatures': {
    chapterId: 'security',
    subchapterId: 'auth',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview']
  },
  'Storage Redundancy': {
    chapterId: 'storage',
    subchapterId: 'blob-storage',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy']
  },
  'Storage Security': {
    chapterId: 'security',
    subchapterId: 'auth',
    sourceUrls: [
      'https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access',
      'https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview'
    ]
  }
};

// Items removed after the 2026-07-13 Microsoft Learn audit: confirmed duplicates,
// out-of-current-scope content, or factually broken items with no salvageable answer.
// Keyed by the deterministic `src-<hash>` id so re-running the importer keeps them excluded.
const EXCLUDED_IDS = new Set([
  'src-e7baa85e66097a3159b3f933', // joke prompt/answer, no factual content
  'src-494515c78a77b3124a193e45', // corrupted merge with an unrelated second question
  'src-872a2c6e24f5b6484f799f21', // unsupported claim about ACR performance fix
  'src-d1fb1cfd28edf9b4f404ca65', // duplicate of src-6f7bf5ea619ebddc4621502c
  'src-177d828b1d2920f7f6f503fe', // duplicate of src-8edb690b955d58a15a002a2e
  'src-2ddc3ba08186b04801eb08b9', // generic stateless-design trivia, not AZ-204 scope
  'src-aa4b39c196335442b4d13323', // generic session/load-balancing trivia, not AZ-204 scope
  'src-b81204626d77cec3f88868d6', // generic HA/failover trivia, not AZ-204 scope
  'src-db3d05386c4cb6de78658c0d', // duplicate of src-ac10d34f0fc1bdda9ec0a2f3
  'src-dc41e5cfc42b053cacda5543', // corrupted merge with an unrelated AzCopy question
  'src-335b948f142f19477b2faead', // Cosmos DB for PostgreSQL is out of current scope
  'src-d6c6b0d24bf86d8a7f78e97f', // incoherent: none of the 4 options is a correct answer
  'src-f1358f1f7c98476c2ee034ae', // incoherent: 'User with Access Policy Permissions' isn't real
  'src-82cbec1ef5b7da7c32d1864b', // duplicate of src-79deac7bc7fcc98d6ebed012
  'src-78e25872876395944046f33f', // duplicate of src-79deac7bc7fcc98d6ebed012
  'src-4ab57e74e8a4f5ad595f1018', // duplicate of src-79deac7bc7fcc98d6ebed012
  'src-ac0c82bf3e5f77ad474cbf9e', // duplicate of src-327d7fc4da7eb6ab2c34fa65
  'src-43716f2a08f9cc2e2ac8f0a6', // general RBAC (VM Contributor), not AZ-204 scope
  'src-3d158ba364bd114805f50fb5', // general RBAC scope-narrowing, not AZ-204 scope
  'src-1bfc7789c03a9298a4cc7876', // general RBAC additive model, not AZ-204 scope
  'src-9996e0951684e075d8a35f8e', // Azure RBAC deny assignments, not AZ-204 scope
  'src-87a482cba329e5c4aa86847f', // App Insights usage-analysis, not AZ-204 scope
  'src-1d3bb87c691edc718e97aab8', // App Insights usage-analysis, not AZ-204 scope
  'src-5e79daa9934f56b4bcd9890b', // App Insights usage-analysis, not AZ-204 scope
  'src-b9ace46a83a7f447d98346c5', // App Insights usage-analysis, not AZ-204 scope
  'src-fe38859b0084c71d96ab62dc', // App Insights usage-analysis, not AZ-204 scope
  'src-8a5413b1a3f883382831442d', // App Insights usage-analysis, not AZ-204 scope
  'src-15ed1285b5fb80faa6e0b0ef', // App Insights usage-analysis, not AZ-204 scope
  'src-95c2168609866aeaf5f2b661', // App Insights usage-analysis, not AZ-204 scope
  'src-7ea02957123a6e179f96c97f', // App Insights usage-analysis, not AZ-204 scope
  'src-d9a8dee096b88aeded561613', // App Insights usage-analysis, not AZ-204 scope
  'src-2dac2b68c15a4f35ba055148', // App Insights usage-analysis, not AZ-204 scope
  'src-555e4f2ee577fb5da50a1258', // targets the retired Azure Mobile Apps SDK
  'src-953ab764a37bb6815f00d97b', // none of the 4 options can fetch a Key Vault TLS cert via APIM policy
  'src-4b10e167390971edca510501', // fabricated Service Bus managed-identity connection-string syntax
  'src-ccf5835c9ff3c0e83a97f56e' // 'Parallel Stream Processing' is not a real Service Bus feature
]);

function correctionFor(prompt, answer) {
  if (prompt.includes('using Azure.CosmosDb')) {
    return {
      answer:
        '```cs\n' +
        'using Microsoft.Azure.Cosmos;\n\n' +
        'CosmosClient cosmosClient = new CosmosClient("https://mycosmosdbaccount.documents.azure.com:443/", configuration["CosmosKey"]);\n\n' +
        'Database database = await cosmosClient.CreateDatabaseIfNotExistsAsync("db");\n\n' +
        'Container container = await database.CreateContainerAsync(\n' +
        '    id: "id",\n' +
        '    partitionKeyPath: "/pk",\n' +
        '    throughput: 400\n' +
        ');\n' +
        '```\n\n' +
        '- **Namespace**: the .NET SDK namespace is `Microsoft.Azure.Cosmos`.\n' +
        '- **Endpoint**: API for NoSQL account endpoints use `documents.azure.com`, not `documents.core.windows.net`.\n' +
        '- **Partition key path**: the path must start with `/`, for example `/pk`.\n' +
        '- **Manual throughput**: the minimum manual throughput is 400 RU/s.\n' +
        '- **Corrected audit note**: the original source answer claimed `db` and `id` are invalid because they are shorter than 3 characters. Microsoft Learn documents a maximum database/container name length of 255 characters; that 3-63 claim is not a valid Cosmos DB correction.',
      correctionNotes:
        'Corrected invalid database/container name-length claim against Microsoft Learn Cosmos DB limits.',
      extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits']
    };
  }

  if (prompt.includes('order by customername, city asc')) {
    return {
      answer:
        'Queries with `ORDER BY` on multiple properties require a composite index that follows the same property order as the query. For `ORDER BY customername, city ASC`, define a composite index in this order:\n\n' +
        '```json\n' +
        '{\n' +
        '  "automatic": true,\n' +
        '  "indexingMode": "consistent",\n' +
        '  "includedPaths": [{ "path": "/*" }],\n' +
        '  "excludedPaths": [],\n' +
        '  "compositeIndexes": [\n' +
        '    [\n' +
        '      { "path": "/customername", "order": "ascending" },\n' +
        '      { "path": "/city", "order": "ascending" }\n' +
        '    ]\n' +
        '  ]\n' +
        '}\n' +
        '```\n\n' +
        'Corrected audit note: the source answer had the fields in the wrong order and used descending order for `customername`, which does not match the query.',
      correctionNotes: 'Corrected composite index order and sort direction.',
      extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/cosmos-db/index-policy']
    };
  }

  if (prompt.includes('secure a public domain in Azure App Service')) {
    return {
      answer:
        'Choose **Free Managed Certificate**. App Service managed certificates are issued and renewed by App Service for supported custom domains. They are intended for public custom domains and do not support wildcard certificates.',
      correctionNotes: 'Added missing source explanation for App Service managed certificates.',
      extraSourceUrls: [
        'https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate'
      ]
    };
  }

  if (prompt.includes('deploy a containerized application to Azure and require autoscaling')) {
    return {
      answer:
        'Container Apps use **KEDA (Kubernetes Event-driven Autoscaler)** to support scaling on CPU, memory, HTTP requests, event sources (such as Service Bus, Event Hubs, Kafka), and arbitrary custom metrics. Source: [Set scaling rules in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)\n\n' +
        '- **Azure App Service** can host containers and supports autoscaling, but scaling is limited to built-in or Azure Monitor metrics, making it less flexible than KEDA.\n' +
        '- **Azure Container Instances (ACI)** does not support autoscaling.\n' +
        '- **Azure Functions** can run from containers but scale only on trigger-based events, not arbitrary custom metrics.\n' +
        '- **Azure Logic Apps** is a workflow automation tool, not a general-purpose container hosting service.',
      correctionNotes:
        'Removed a stray AI-assistant meta-question ("Want me to also reformat...") that had leaked into the stored answer text.',
      extraSourceUrls: []
    };
  }

  if (prompt.includes('queues supports automatic dead-lettering')) {
    return {
      answer:
        'Choose **Service Bus Queues**. Azure Service Bus supports dead-letter queues and can dead-letter messages automatically in cases such as TTL expiration when dead-lettering on message expiration is enabled. Azure Queue Storage does not provide the same built-in dead-letter queue feature.',
      correctionNotes: 'Added missing source explanation for Service Bus dead-lettering.',
      extraSourceUrls: [
        'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues'
      ]
    };
  }

  return { answer, correctionNotes: null, extraSourceUrls: [] };
}

// Corrections from the 2026-07-13 Microsoft Learn audit that couldn't be matched by a
// short unique prompt substring alone (they also change `options`/`answerIds`, which
// `correctionFor` above has no access to). Keyed by the deterministic `src-<hash>` id;
// `options`/`answerIds` are optional overrides, `answer` always replaces the parsed answer.
const ID_CORRECTIONS = {
  'src-80759063299ea91610275133': {
    answerIds: ['c'],
    answer:
      'Both system-assigned and user-assigned managed identities can be used to authenticate Azure Container Apps (KEDA-based) custom scale rules against Azure resources such as Azure Queue Storage, Service Bus, and Event Hubs.\n\n' +
      '- Use `"identity": "system"` in a Bicep/ARM scale rule for a system-assigned identity.\n' +
      '- Use `--scale-rule-identity <USER_ASSIGNED_IDENTITY_ID>` with `--user-assigned <ID>` via the Azure CLI for a user-assigned identity.',
    correctionNotes:
      'Corrected: managed identities ARE supported for Container Apps scale-rule authentication (both system- and user-assigned); answer changed from "None" to "Both".',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/container-apps/scale-app']
  },
  'src-1d782e6f55d6f8248e94b624': {
    answerIds: ['c'],
    answer:
      'Only proactively deploying container apps in advance to multiple regions and using Azure Front Door or Azure Traffic Manager to route around a regional outage is the recommended strategy. ' +
      'Azure Container Apps is a single-region service — if the region becomes unavailable, the environment and apps in it are also unavailable, so waiting for regional recovery or manually redeploying after the outage occurs are not the recommended approach.',
    correctionNotes:
      'Corrected: only proactive multi-region deployment + Front Door/Traffic Manager is the recommended strategy, not reactive manual redeployment (removed options a and b from answerIds).',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/reliability/reliability-container-apps']
  },
  'src-6c7cad522339c53bf502baa8': {
    options: [
      { id: 'a', text: 'Azure Resource Management template' },
      { id: 'b', text: 'YAML file' },
      { id: 'c', text: '`az container create` command' },
      { id: 'd', text: 'Deployment manifest (YAML)' }
    ],
    answerIds: ['a'],
    answer:
      'When a container-instance deployment also needs additional Azure resources (for example an Azure Files share or a virtual network) alongside the container group, use an Azure Resource Manager template — ' +
      'it can be readily adapted for scenarios that need to deploy more Azure resources together with the container group. A YAML file is recommended only when the deployment includes just the container instances themselves.',
    correctionNotes:
      'Corrected: item was corrupted by a merge with an unrelated second question (Container Groups feature). Removed the merged-in options/content and kept only the ARM-template-vs-YAML guidance.',
    extraSourceUrls: [
      'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-multi-container-group'
    ]
  },
  'src-90989bd905c1612d48203b7a': {
    answerIds: ['a'],
    answer:
      "Only General purpose v2 at Standard performance tier is ZRS-eligible among these account types. GPv2 does not have a distinct 'Premium performance tier' — " +
      'ZRS-eligible Premium storage requires a separate account kind, Premium block blob storage (BlockBlobStorage), which is not the same as "GPv2 Premium".',
    correctionNotes:
      "Corrected: removed incorrect 'GPv2 at Premium tier' as a ZRS-eligible option; only GPv2 Standard is ZRS-eligible.",
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy']
  },
  'src-f3b52929f4c51e7bf5197561': {
    answerIds: ['c'],
    answer:
      'This premise is invalid: the Cosmos DB API for Table does not accept SQL query syntax like SELECT/FROM/WHERE. ' +
      'Table API queries use OData filter syntax (or LINQ translated to OData) instead, so this exact query would not run against the Table API as written — it would produce a syntax error, not JSON data.',
    correctionNotes:
      'Corrected: Table API does not support SQL SELECT syntax, only OData filters; answer changed from "JSON" to "error due to incorrect syntax".',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/cosmos-db/table/tutorial-query']
  },
  'src-8908b87202c8aa752785bcdf': {
    answerIds: ['e'],
    answer:
      'For `Azure.Storage.Queues.QueueClient`, use `SendMessageAsync(string)` directly — pass `text` as-is. ' +
      "There is no `Message` wrapper type in this SDK (that type belongs to the legacy `Microsoft.Azure.ServiceBus` SDK, not Azure Queue Storage), so `Message(...)`-based options don't apply here.",
    correctionNotes:
      'Corrected: Azure.Storage.Queues.QueueClient has no SendAsync(Message) method; use SendMessageAsync(string) and pass text directly.',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/dotnet/api/azure.storage.queues.queueclient']
  },
  'src-29fafe6479ac8852d835aff3': {
    answerIds: ['a', 'd', 'e', 'f', 'g', 'h'],
    answer:
      'User-facing apps without the ability to securely store secrets: Authorization code, Implicit, Device code, Integrated Windows, Interactive, Username/password. ' +
      'On-behalf-of is not a public-client flow — it is used by a confidential client (a middle-tier service) acting on behalf of a user, and requires the middle tier to authenticate itself with a client secret or certificate.',
    correctionNotes:
      'Corrected: removed "On-behalf-of" from public-client flows — it is a confidential-client-only flow.',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-applications']
  },
  'src-586b36c5c8f175f2dc86a79d': {
    answerIds: ['b', 'c'],
    answer:
      'Server-based apps that can securely handle secrets: Client credentials, On-behalf-of. ' +
      'Integrated Windows and Username/password (ROPC) are public-client-only flows, not confidential-client flows.',
    correctionNotes:
      'Corrected: removed "Integrated Windows" and "Username/password" from confidential-client flows — both are public-client-only.',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-applications']
  },
  'src-e8fa6d692503b41062c1544d': {
    answer:
      'Custom TrackAvailability tests remain the way to cover multi-request or authenticated test scenarios that a single-request Standard test cannot handle, but current Microsoft documentation now labels this ' +
      "as archived Classic API guidance rather than 'the long term supported solution' — Standard tests are the recommended availability test type for current monitoring in general, with URL ping tests deprecated (retiring 2026-09-30).",
    correctionNotes:
      'Corrected: Custom TrackAvailability is documented as archived Classic API guidance, not "the long term supported solution"; Standard tests are recommended for current monitoring in general.',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/azure-monitor/app/availability-overview']
  },
  'src-caa03b76e59d6566a9beecdb': {
    answer:
      "The Clone App feature is found in the Development Tools section of the app's menu in the Azure portal, not General Settings.",
    correctionNotes:
      'Corrected: answer explanation was copy-pasted from an unrelated item about General Settings; replaced with the correct Development Tools explanation.',
    extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/app-service/app-service-plan-manage']
  }
};

// Corrections applied as a targeted find/replace on the parsed answer text (no
// options/answerIds change needed). Keyed by id -> [oldSubstring, newSubstring].
const TEXT_CORRECTIONS = {
  'src-f30fa7e166328223be26bb1d': ['--functions-version 3', '--functions-version 4'],
  'src-e8b0e5f13fc3dfffc1b770a2': ['--functions-version 3', '--functions-version 4'],
  'src-b96627f3bf938d7afe7a5dc0': ['--functions-version 3', '--functions-version 4'],
  'src-302b708946e8c478b9d0eccf': [
    'CreateContainerIfNotExistsAsync(id: , partitionKeyPath: $"/{partitionKey}", throughput: throughputValue)',
    'CreateContainerIfNotExistsAsync(id: containerName, partitionKeyPath: $"/{partitionKey}", throughput: throughputValue)'
  ],
  'src-315bbb38dd3a8964167b9281': ['Standard_GZRS', 'Standard_RAGZRS'],
  'src-c7f0d92f2eb6d363be676fa9': [
    'var client = new CertificateClient(new Uri("https://cert-holder.vault.azure.net"), new DefaultAzureCredential());\n        var certificate = await client.GetCertificateAsync(config.certificateName);\n        // Alt: X509Certificate2 certificate = new X509Certificate2(config.certificatePath, config.certificatePassword);\n        client = builder.WithCertificate(certificate).Build();',
    'var secretClient = new SecretClient(new Uri("https://cert-holder.vault.azure.net"), new DefaultAzureCredential());\n        KeyVaultSecret certSecret = await secretClient.GetSecretAsync(config.certificateName);\n        var certBytes = Convert.FromBase64String(certSecret.Value);\n        var certificate = new X509Certificate2(certBytes, (string)null, X509KeyStorageFlags.MachineKeySet);\n        client = builder.WithCertificate(certificate).Build();'
  ],
  'src-ed46e9e4a8007f610128101a': [
    '\t"groupMembershipClaims": "SecurityGroup",\n\t"oauth2AllowImplicitFlow": true\n}\n```\n\n`groupMembershipClaims` will include the user\'s security group memberships in the claims whenever a token is requested. `oauth2AllowImplicitFlow` is often relevant when you\'re working with SPAs or other scenarios where the Implicit Grant Flow is used.',
    '\t"groupMembershipClaims": "SecurityGroup"\n}\n```\n\n`groupMembershipClaims` will include the user\'s security group memberships in the claims whenever a token is requested. `oauth2AllowImplicitFlow` should not be added here — Microsoft discourages the implicit grant flow even for SPAs and recommends the authorization code flow with PKCE instead, and this scenario never asked for SPA/implicit support.'
  ],
  'src-a402dd6142b5fe63510ccd3f': [
    '- `cloud_RoleInstance` is indirectly set via `service.name` and `service.namespace`.',
    '- `cloud_RoleName` (not `cloud_RoleInstance`) is derived from `service.name` and `service.namespace`; `cloud_RoleInstance` is set independently via the `service.instance.id` resource attribute.'
  ],
  'src-6ccd69c73b7922f1745e0355': [
    'The exception gets logged to Event Log. The Write method of the EventSource class allows you to log data to the Event Log.',
    'The exception is emitted as an ETW (Event Tracing for Windows) / EventPipe trace event via `EventSource.Write`, not written to the classic Windows Event Log — that distinct mechanism is `System.Diagnostics.EventLog`. The ETW/EventPipe event can be observed via an in-process EventListener or external tools like PerfView, Logman, or dotnet-trace.'
  ],
  'src-109dc7569cbc21675c3c9e62': [
    'However, only Event Hub provides configurable message retention (up to 7 days).',
    'However, only Event Hub provides configurable message retention, with a tier-dependent ceiling: 1 day on Basic, 7 days on Standard, and up to 90 days on Premium/Dedicated.'
  ],
  'src-aabeb0b6caaf1f44da9402b8': [
    'The Premium tier is required to deploy self-hosted gateways, which are essential for managing APIs across different environments.',
    'Self-hosted gateway is also available on the Developer tier, so Premium is not strictly required to deploy it — but Premium is recommended here since Developer has no SLA and is not meant for production, and self-hosted gateways are essential for managing APIs across different environments.'
  ],
  'src-ecb7753c155a66b0f1f5812e': [
    'Pre-warmed instances is a feature of Automatic scaling, which is supported only on `PremiumV2` and `PremiumV3` plans.',
    'Pre-warmed instances is a feature of Automatic scaling, which is supported on `PremiumV2`, `PremiumV3`, and `PremiumV4` plans (all under the general `Premium` tier).'
  ],
  'src-767e004879c84b95bb531226': [
    '- `PremiumV2` and `PremiumV3`: yes (default 1)',
    '- `PremiumV2`, `PremiumV3`, and `PremiumV4`: yes (default 1)'
  ]
};

const TEXT_CORRECTION_SOURCE_URLS = {
  'src-f30fa7e166328223be26bb1d': ['https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions'],
  'src-e8b0e5f13fc3dfffc1b770a2': ['https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions'],
  'src-b96627f3bf938d7afe7a5dc0': ['https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions'],
  'src-315bbb38dd3a8964167b9281': ['https://learn.microsoft.com/en-us/azure/storage/common/redundancy-migration'],
  'src-c7f0d92f2eb6d363be676fa9': [
    'https://learn.microsoft.com/en-us/dotnet/api/overview/azure/security.keyvault.certificates-readme'
  ],
  'src-ed46e9e4a8007f610128101a': ['https://learn.microsoft.com/en-us/entra/identity-platform/reference-app-manifest'],
  'src-a402dd6142b5fe63510ccd3f': ['https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-configuration'],
  'src-6ccd69c73b7922f1745e0355': ['https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.tracing.eventsource'],
  'src-109dc7569cbc21675c3c9e62': ['https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-quotas'],
  'src-aabeb0b6caaf1f44da9402b8': ['https://learn.microsoft.com/en-us/azure/api-management/self-hosted-gateway-overview'],
  'src-ecb7753c155a66b0f1f5812e': ['https://learn.microsoft.com/en-us/azure/app-service/manage-automatic-scaling'],
  'src-767e004879c84b95bb531226': ['https://learn.microsoft.com/en-us/azure/app-service/manage-automatic-scaling']
};

const TEXT_CORRECTION_NOTES = {
  'src-f30fa7e166328223be26bb1d':
    'Corrected: --functions-version 3 replaced with 4 (Functions runtime 3.x reached end of support 2022-12-13).',
  'src-e8b0e5f13fc3dfffc1b770a2':
    'Corrected: --functions-version 3 replaced with 4 (Functions runtime 3.x reached end of support 2022-12-13).',
  'src-b96627f3bf938d7afe7a5dc0':
    'Corrected: --functions-version 3 replaced with 4 (Functions runtime 3.x reached end of support 2022-12-13).',
  'src-302b708946e8c478b9d0eccf':
    'Corrected: fixed the empty `id:` named argument syntax error in CreateContainerIfNotExistsAsync.',
  'src-315bbb38dd3a8964167b9281':
    'Corrected: SKU name fixed to Standard_RAGZRS (read-access variant) for a scenario requiring read access to the secondary region.',
  'src-c7f0d92f2eb6d363be676fa9':
    'Corrected: CertificateClient never exposes the private key; use SecretClient to retrieve the PFX for MSAL WithCertificate().',
  'src-ed46e9e4a8007f610128101a':
    'Corrected: removed unrelated/discouraged oauth2AllowImplicitFlow suggestion; only groupMembershipClaims is needed.',
  'src-a402dd6142b5fe63510ccd3f':
    'Corrected: cloud_RoleName (not cloud_RoleInstance) is derived from service.name/service.namespace.',
  'src-6ccd69c73b7922f1745e0355':
    'Corrected: EventSource emits ETW/EventPipe trace events, distinct from the classic Windows Event Log.',
  'src-109dc7569cbc21675c3c9e62':
    'Corrected: retention ceiling is tier-dependent (Basic 1 day, Standard 7 days, Premium/Dedicated up to 90 days), not a flat 7 days.',
  'src-aabeb0b6caaf1f44da9402b8':
    'Corrected: self-hosted gateway is also available on the Developer tier; Premium is recommended (SLA) rather than strictly required.',
  'src-ecb7753c155a66b0f1f5812e':
    'Corrected: Automatic scaling pre-warmed instances are now supported on PremiumV2, PremiumV3, and PremiumV4.',
  'src-767e004879c84b95bb531226':
    'Corrected: Always-ready/prewarmed instances are supported on PremiumV2, PremiumV3, and PremiumV4, not just V2/V3.'
};

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseQuestionFile(topic, markdown) {
  const lines = markdown.split('\n');
  const items = [];
  let section = null;
  let question = [];
  let answer = [];
  let options = [];
  let answerIds = [];

  function flush() {
    if (question.length === 0) return;
    const prompt = question.join('\n').trim();
    const topicDetails = topicMap[topic];
    if (!topicDetails) throw new Error(`Missing topic mapping for ${topic}`);
    const id = `src-${hash(`${topic}:${prompt}`).slice(0, 24)}`;

    if (EXCLUDED_IDS.has(id)) {
      question = [];
      answer = [];
      options = [];
      answerIds = [];
      return;
    }

    const rawAnswer = answer.join('\n').trim();
    const correction = correctionFor(prompt, rawAnswer);
    let finalAnswer = correction.answer;
    let finalOptions = options;
    let finalAnswerIds = answerIds;
    let finalCorrectionNotes = correction.correctionNotes;
    let extraSourceUrls = correction.extraSourceUrls;

    if (ID_CORRECTIONS[id]) {
      const idCorrection = ID_CORRECTIONS[id];
      finalAnswer = idCorrection.answer;
      if (idCorrection.options) finalOptions = idCorrection.options;
      if (idCorrection.answerIds) finalAnswerIds = idCorrection.answerIds;
      finalCorrectionNotes = idCorrection.correctionNotes;
      extraSourceUrls = idCorrection.extraSourceUrls;
    } else if (TEXT_CORRECTIONS[id]) {
      const [oldText, newText] = TEXT_CORRECTIONS[id];
      if (!finalAnswer.includes(oldText)) {
        throw new Error(`Expected text correction target not found in ${id}: "${oldText}"`);
      }
      finalAnswer = finalAnswer.replace(oldText, newText);
      finalCorrectionNotes = TEXT_CORRECTION_NOTES[id];
      extraSourceUrls = TEXT_CORRECTION_SOURCE_URLS[id] ?? [];
    }

    items.push({
      id,
      sourceTopic: topic,
      chapterId: topicDetails.chapterId,
      subchapterId: topicDetails.subchapterId,
      prompt,
      answer: finalAnswer,
      options: finalOptions,
      answerIds: finalAnswerIds,
      sourceUrls: Array.from(new Set([...topicDetails.sourceUrls, ...extraSourceUrls])),
      verifiedAt,
      auditStatus: 'verified',
      verificationLevel: 'topic_microsoft_mapped',
      correctionNotes: finalCorrectionNotes
    });
    question = [];
    answer = [];
    options = [];
    answerIds = [];
  }

  for (const line of lines) {
    if (line.startsWith('Question:')) {
      flush();
      section = 'question';
      question.push(line.replace('Question:', '').trimStart());
      continue;
    }

    if (line.startsWith('Answer:')) {
      section = 'answer';
      answer.push(line.replace('Answer:', '').trimStart());
      continue;
    }

    const optionMatch = line.match(/^\s*- \[(x|\s)\]\s(.+)$/i);
    if (optionMatch) {
      section = 'option';
      const id = String.fromCharCode(97 + options.length);
      options.push({ id, text: optionMatch[2] });
      if (optionMatch[1].toLowerCase() === 'x') answerIds.push(id);
      continue;
    }

    if (line.trim() === '---') continue;

    if (section === 'question') question.push(line);
    if (section === 'answer') answer.push(line);
  }

  flush();
  return items;
}

async function loadSourceFiles() {
  const response = await fetch(repoContentsUrl);
  if (!response.ok) {
    throw new Error(`Failed to list source questions: ${response.status} ${response.statusText}`);
  }

  const files = await response.json();
  const markdownFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.md'));
  const results = [];

  for (const file of markdownFiles) {
    const rawResponse = await fetch(file.download_url);
    if (!rawResponse.ok) {
      throw new Error(`Failed to download ${file.path}: ${rawResponse.status}`);
    }
    const topic = file.name.replace(/\.md$/, '');
    const markdown = await rawResponse.text();
    results.push(...parseQuestionFile(topic, markdown));
  }

  return results;
}

const items = await loadSourceFiles();
await fs.writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceRepository: 'https://github.com/arvigeus/AZ-204',
      sourceLicense: 'Custom Non-Commercial Attribution License (CNAL) Version 1.0',
      policy:
        'Generated items are mapped to official Microsoft Learn topic sources and included in the app with attribution. Known factual issues discovered during audit are corrected in this generated output.',
      items
    },
    null,
    2
  )}\n`
);

console.log(
  `Imported ${items.length} source quiz items with Microsoft Learn mappings into ${outputPath}.`
);
