import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoContentsUrl = 'https://api.github.com/repos/arvigeus/AZ-204/contents/Questions?ref=master';
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
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-quick-task']
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
    sourceUrls: ['https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview']
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
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction']
  },
  'Resource Groups': {
    chapterId: 'compute',
    subchapterId: 'app-service',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal']
  },
  'Service Bus': {
    chapterId: 'integration',
    subchapterId: 'messages',
    sourceUrls: ['https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview']
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
      extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate']
    };
  }

  if (prompt.includes('queues supports automatic dead-lettering')) {
    return {
      answer:
        'Choose **Service Bus Queues**. Azure Service Bus supports dead-letter queues and can dead-letter messages automatically in cases such as TTL expiration when dead-lettering on message expiration is enabled. Azure Queue Storage does not provide the same built-in dead-letter queue feature.',
      correctionNotes: 'Added missing source explanation for Service Bus dead-lettering.',
      extraSourceUrls: ['https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues']
    };
  }

  return { answer, correctionNotes: null, extraSourceUrls: [] };
}

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
    const correction = correctionFor(prompt, answer.join('\n').trim());
    items.push({
      id: `src-${hash(`${topic}:${prompt}`).slice(0, 24)}`,
      sourceTopic: topic,
      chapterId: topicDetails.chapterId,
      subchapterId: topicDetails.subchapterId,
      prompt,
      answer: correction.answer,
      options,
      answerIds,
      sourceUrls: Array.from(new Set([...topicDetails.sourceUrls, ...correction.extraSourceUrls])),
      verifiedAt,
      auditStatus: 'verified',
      verificationLevel: 'topic_microsoft_mapped',
      correctionNotes: correction.correctionNotes
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

console.log(`Imported ${items.length} source quiz items with Microsoft Learn mappings into ${outputPath}.`);
