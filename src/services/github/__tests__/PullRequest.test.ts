import {
  IssuesAddAssigneesResponseData,
  IssuesAddLabelsResponseData,
  OctokitResponse,
  PullsCreateResponseData,
} from '@octokit/types'

import { OrganizationName } from '@sr-services/Constants'
import * as Client from '@sr-services/github/Client'
import { Branch, Repository } from '@sr-services/github/Git'
import {
  addLabels,
  assignOwners,
  createPullRequest,
} from '@sr-services/github/PullRequest'

const repo = 'my-repo'

describe('PullRequest', () => {
  describe('addLabels', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(Client.client.issues, 'addLabels')
        .mockImplementation(
          (_args?: {
            issue_number: number
            labels: string[]
            owner: string
            repo: Repository
          }) =>
            Promise.resolve({
              data: [{ name: 'my-label' }],
            } as OctokitResponse<IssuesAddLabelsResponseData>)
        )
      const result = await addLabels(repo, 23, ['my-label'])
      expect(spy).toHaveBeenCalledWith({
        issue_number: 23,
        labels: ['my-label'],
        owner: OrganizationName,
        repo,
      })
      expect(result[0].name).toEqual('my-label')
      spy.mockRestore()
    })
  })

  describe('assignOwners', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(Client.client.issues, 'addAssignees')
        .mockImplementation(
          (_args?: {
            assignees?: string[]
            issue_number: number
            owner: string
            repo: Repository
          }) =>
            Promise.resolve({
              data: { id: 1234 },
            } as OctokitResponse<IssuesAddAssigneesResponseData>)
        )
      const result = await assignOwners(repo, 23, ['dperrett'])
      expect(spy).toHaveBeenCalledWith({
        assignees: ['dperrett'],
        issue_number: 23,
        owner: OrganizationName,
        repo,
      })
      expect(result.id).toEqual(1234)
      spy.mockRestore()
    })
  })

  describe('createPullRequest', () => {
    it('calls the Github API', async () => {
      const clientSpy = jest
        .spyOn(Client, 'clientForToken')
        .mockImplementation((_token: string) => Client.client)
      const spy = jest
        .spyOn(Client.client.pulls, 'create')
        .mockImplementation(
          (_args?: {
            base: Branch
            body?: string
            draft?: boolean
            head: Branch
            owner: string
            repo: Repository
            title: string
          }) =>
            Promise.resolve({
              data: { id: 1234 },
            } as OctokitResponse<PullsCreateResponseData>)
        )
      const result = await createPullRequest(
        repo,
        'master',
        'feature/add-a-widget',
        'Add a Widget',
        'Some description',
        'my-token'
      )
      expect(spy).toHaveBeenCalledWith({
        base: 'master',
        body: 'Some description',
        draft: true,
        head: 'feature/add-a-widget',
        owner: OrganizationName,
        repo,
        title: 'Add a Widget',
      })
      expect(result.id).toEqual(1234)
      clientSpy.mockRestore()
      spy.mockRestore()
    })
  })
})
