jest.mock('@sr-services/Constants', () => ({
  __esModule: true,
  CredentialsApiPrefix: 'https://users.example.com/api/private/credentials/',
  CredentialsApiSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  GithubWriteToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  JiraEmail: 'xxxx@example.com',
  JiraHost: 'example.atlassian.net',
  JiraToken: 'xxxxxxxxxxxxxxxxxxxxxxxx',
  OrganizationName: 'octokit',
  SlackErrorChannelId: 'C0000000000',
  SlackToken: 'xoxb-xxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
}))