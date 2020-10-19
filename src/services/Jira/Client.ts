import JiraClient from 'jira-client'

import { jiraEmail, jiraHost, jiraToken } from '@sr-services/Constants'

export const client = new JiraClient({
  apiVersion: '2',
  host: jiraHost(),
  password: jiraToken(),
  protocol: 'https',
  strictSSL: true,
  username: jiraEmail(),
})
