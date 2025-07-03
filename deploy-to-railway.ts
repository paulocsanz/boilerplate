async function getDefaultBranch(githubRepo: string): Promise<string> {
  try {
    const [owner, repo] = githubRepo.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch GitHub repo info: ${response.status}`);
      return 'main';
    }
    
    const data = await response.json();
    return data.default_branch || 'main';
  } catch (error) {
    console.warn('Error fetching GitHub repo info:', error);
    return 'main';
  }
}

async function deployToRailway(apiToken: string, projectName: string, githubRepo: string, branch?: string) {
  const API_URL = 'https://backboard.railway.app/graphql/v2';
  
  // Fetch default branch if not provided
  if (!branch) {
    console.log(`Fetching default branch for ${githubRepo}...`);
    branch = await getDefaultBranch(githubRepo);
    console.log(`Using branch: ${branch}`);
  }
  
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  async function graphqlRequest(query: string, variables: unknown, json = true) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });
    
    console.log(JSON.stringify({ query, variables }, null, 2))
    const data = json ? await response.json() : {};
    console.log(JSON.stringify({ data }, null, 2))
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }
    return data;
  }

  // Create project
  console.log('Creating project...');
  const createProjectMutation = `
    mutation createProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  const projectData = await graphqlRequest(createProjectMutation, {
    input: {
      name: projectName
    }
  });

  const project = projectData.data.projectCreate;
  const projectId = project.id;
  const environmentId = project.environments.edges[0].node.id;

  console.log(`Created project: ${project.name} (${projectId})`);
  console.log(`Environment ID: ${environmentId}`);

  // Fetch Postgres template details first
  console.log('\nFetching Postgres template details...');
  const templateQuery = `
    query template($code: String!) {
      template(code: $code) {
        id
        name
        serializedConfig
      }
    }
  `;

  const templateData = await graphqlRequest(templateQuery, {
    code: "postgres"
  });

  const template = templateData.data.template;
  console.log(`Found template: ${template.name} (${template.id})`);

  // Deploy Postgres using templateDeployV2
  console.log('\nDeploying Postgres from template...');
  const deployPostgresMutation = `
    mutation templateDeployV2($input: TemplateDeployV2Input!) {
      templateDeployV2(input: $input) {
        projectId
        workflowId
      }
    }
  `;

  await graphqlRequest(deployPostgresMutation, {
    input: {
      templateId: template.id,
      projectId,
      environmentId,
      serializedConfig: template.serializedConfig,
    }
  });
  console.log('Postgres deployed successfully');

  // Create backend service with variables
  console.log('\nCreating backend service...');
  const createServiceMutation = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const backendVars = {
    PORT: '3000',
    DATABASE_URL: '${{Postgres.DATABASE_URL}}'
  };

  const backendData = await graphqlRequest(createServiceMutation, {
    input: {
      projectId,
      environmentId,
      name: "backend",
      source: {
        repo: githubRepo,
        branch: branch
      },
      variables: backendVars
    }
  });

  const backendId = backendData.data.serviceCreate.id;
  console.log(`Created backend service (${backendId}) from branch: ${branch}`);

  // Create frontend service
  console.log('\nCreating frontend service...');
  const frontendData = await graphqlRequest(createServiceMutation, {
    input: {
      projectId,
      environmentId,
      name: "frontend",
      source: {
        repo: githubRepo,
        branch: branch
      }
    }
  });

  const frontendId = frontendData.data.serviceCreate.id;
  console.log(`Created frontend service (${frontendId}) from branch: ${branch}`);

  // Update service instances to set rootDirectory
  console.log('\nSetting up root directories...');
  
  const serviceInstanceUpdateMutation = `
    mutation serviceInstanceUpdate($environmentId: String!, $input: ServiceInstanceUpdateInput!, $serviceId: String!) {
      serviceInstanceUpdate(environmentId: $environmentId, input: $input, serviceId: $serviceId)
    }
  `;

  // Update backend service instance
  await graphqlRequest(serviceInstanceUpdateMutation, {
    environmentId,
    serviceId: backendId,
    input: {
      rootDirectory: "backend"
    }
  }, false);
  console.log('Set backend root directory');

  // Update frontend service instance
  await graphqlRequest(serviceInstanceUpdateMutation, {
    environmentId,
    serviceId: frontendId,
    input: {
      rootDirectory: "frontend"
    }
  }, false);
  console.log('Set frontend root directory');

  // Create public domains for both services
  console.log('\nCreating public domains...');
  
  const createDomainMutation = `
    mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `;

  // Create domain for backend
  const backendDomainData = await graphqlRequest(createDomainMutation, {
    input: {
      environmentId,
      serviceId: backendId
    }
  });
  console.log(`Backend domain: https://${backendDomainData.data.serviceDomainCreate.domain}`);

  // Create domain for frontend
  const frontendDomainData = await graphqlRequest(createDomainMutation, {
    input: {
      environmentId,
      serviceId: frontendId
    }
  });
  console.log(`Frontend domain: https://${frontendDomainData.data.serviceDomainCreate.domain}`);

  // Set backend URL for frontend using variable reference
  console.log('\nSetting backend URL reference...');
  await graphqlRequest(`
    mutation addVariable($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
  `, {
    input: {
      projectId,
      environmentId,
      serviceId: frontendId,
      name: 'VITE_BACKEND_URL',
      value: 'https://${{backend.RAILWAY_PUBLIC_DOMAIN}}'
    }
  });
  console.log('Set VITE_BACKEND_URL reference using Railway variable reference');

  console.log(`\nProject ${projectName} created successfully!`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Backend URL: https://${backendDomainData.data.serviceDomainCreate.domain}`);
  console.log(`Frontend URL: https://${frontendDomainData.data.serviceDomainCreate.domain}`);
  console.log(`View your project at: https://railway.app/project/${projectId}`);
}

// Usage
const RAILWAY_API_TOKEN = process.env.RAILWAY_API_TOKEN || '';
const PROJECT_NAME = 'fullstack-boilerplate';
const GITHUB_REPO = process.env.GITHUB_REPO || 'paulocsanz/boilerplate';
const BRANCH = process.env.BRANCH; // Optional - will fetch default branch if not provided

if (!RAILWAY_API_TOKEN) {
  console.error('Please set RAILWAY_API_TOKEN environment variable');
  process.exit(1);
}

console.log(`Deploying from repository: ${GITHUB_REPO}`);
if (BRANCH) {
  console.log(`Using specified branch: ${BRANCH}`);
}

deployToRailway(RAILWAY_API_TOKEN, PROJECT_NAME, GITHUB_REPO, BRANCH)
  .then(() => console.log('Deployment initiated successfully'))
  .catch(error => console.error('Deployment failed:', error));
