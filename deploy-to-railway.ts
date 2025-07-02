async function deployToRailway(apiToken: string, projectName: string, githubRepo: string) {
  const API_URL = 'https://backboard.railway.app/graphql/v2';
  
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  async function graphqlRequest(query: string, variables: unknown) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });
    
    const data = await response.json();
    console.log(JSON.stringify({ query, variables, data }, null, 2))
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
        repo: githubRepo
      },
      variables: backendVars,
      /*
      buildCommand: 'cd backend && bun install && bun run build',
      startCommand: 'cd backend && bun run start'
      */
    }
  });

  const backendId = backendData.data.serviceCreate.id;
  console.log(`Created backend service (${backendId})`);

  // Create frontend service
  console.log('\nCreating frontend service...');
  const frontendData = await graphqlRequest(createServiceMutation, {
    input: {
      projectId,
      environmentId,
      name: "frontend",
      source: {
        repo: githubRepo
      },
      /*
      buildCommand: 'cd frontend && bun install && bun run build',
      startCommand: 'cd frontend && bun run preview --host 0.0.0.0 --port $PORT'
      */
    }
  });

  const frontendId = frontendData.data.serviceCreate.id;
  console.log(`Created frontend service (${frontendId})`)

  console.log(`\nProject ${projectName} created successfully!`);
  console.log(`Project ID: ${projectId}`);
  console.log(`View your project at: https://railway.app/project/${projectId}`);
}

// Usage
const RAILWAY_API_TOKEN = process.env.RAILWAY_API_TOKEN || '';
const PROJECT_NAME = 'fullstack-boilerplate';
const GITHUB_REPO = process.env.GITHUB_REPO || 'github.com/paulocsanz/boilerplate';

if (!RAILWAY_API_TOKEN) {
  console.error('Please set RAILWAY_API_TOKEN environment variable');
  process.exit(1);
}

deployToRailway(RAILWAY_API_TOKEN, PROJECT_NAME, GITHUB_REPO)
  .then(() => console.log('Deployment initiated successfully'))
  .catch(error => console.error('Deployment failed:', error));
