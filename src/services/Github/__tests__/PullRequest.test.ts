import {
  IssuesAddAssigneesResponseData,
  OctokitResponse,
  PullsCreateResponseData,
  PullsCreateReviewResponseData,
  PullsGetResponseData,
  PullsListCommitsResponseData,
  PullsListFilesResponseData,
  PullsRequestReviewersResponseData,
  PullsUpdateResponseData,
} from '@octokit/types'
import Schema from '@octokit/webhooks-types'

import { Branch, Repository } from '@sr-services/Github/Git'
import {
  assignOwners,
  assignReviewers,
  extractPullRequestNumber,
  createPullRequest,
  getIssueKey,
  getPullRequest,
  listPullRequestCommits,
  listPullRequestFiles,
  pullRequestUrl,
  reviewPullRequest,
  updatePullRequest,
} from '@sr-services/Github/PullRequest'
import { organizationName } from '@sr-services/Inputs'
import {
  mockGitCommit,
  mockGitFile,
  mockGithubClient,
  mockGithubPullRequest,
  mockGithubPullRequestCreateResponse,
  mockGithubPullRequestReviewResponse,
  mockGithubPullRequestUpdateResponse,
  mockIssuesAddAssigneesResponseData,
  mockPullsRequestReviewersResponseData,
  mockReadClient,
} from '@sr-tests/Mocks'

interface GetPullParams {
  owner: string
  pull_number: number
  repo: Repository
}

const pull_number = mockGithubPullRequest.number
const repo = 'my-repo'
const fetchPullParams = {
  owner: organizationName(),
  pull_number,
  repo,
}

jest.mock('@sr-services/Github/Client', () => ({
  client: () => mockGithubClient,
  clientForToken: () => mockGithubClient,
  readClient: () => mockReadClient,
}))

describe('PullRequest', () => {
  describe('assignOwners', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockGithubClient.issues, 'addAssignees')
        .mockImplementation(
          (_args?: {
            assignees?: string[]
            issue_number: number
            owner: string
            repo: Repository
          }) =>
            Promise.resolve({
              data: mockIssuesAddAssigneesResponseData,
            } as OctokitResponse<IssuesAddAssigneesResponseData>)
        )
      const result = await assignOwners(repo, 23, ['dperrett'])
      expect(spy).toHaveBeenCalledWith({
        assignees: ['dperrett'],
        issue_number: 23,
        owner: organizationName(),
        repo,
      })
      expect(result.id).toEqual(1234)
      spy.mockRestore()
    })
  })

  describe('assignReviewers', () => {
    it('calls the Github API', async () => {
      const getPullRequestSpy = jest
        .spyOn(mockReadClient.pulls, 'get')
        .mockImplementation((_args?: GetPullParams) =>
          Promise.resolve({
            data: mockGithubPullRequest,
          } as OctokitResponse<PullsGetResponseData>)
        )
      const requestReviewersSpy = jest
        .spyOn(mockGithubClient.pulls, 'requestReviewers')
        .mockImplementation(
          (_args?: {
            reviewers?: string[]
            owner: string
            pull_number: number
            repo: Repository
          }) =>
            Promise.resolve({
              data: mockPullsRequestReviewersResponseData,
            } as OctokitResponse<PullsRequestReviewersResponseData>)
        )
      const result = await assignReviewers(repo, 23, ['dhh', 'dperrett'])
      expect(requestReviewersSpy).toHaveBeenCalledWith({
        owner: organizationName(),
        pull_number: 23,
        repo,
        reviewers: ['dperrett'],
      })
      expect(result.id).toEqual(1234)
      getPullRequestSpy.mockRestore()
      requestReviewersSpy.mockRestore()
    })
  })

  describe('extractPullRequestNumber', () => {
    it('returns the number added by automation', () => {
      const number = extractPullRequestNumber(
        '[STUDIO-123] [#456] Fix the widget'
      )
      expect(number).toEqual(456)
    })

    it('returns the number from a merge commit', () => {
      const number = extractPullRequestNumber(
        'Merge pull request #456 Fix the widget'
      )
      expect(number).toEqual(456)
    })

    it('returns undefined if no number can be found', () => {
      const number = extractPullRequestNumber(
        '[STUDIO-123] [456] Fix the widget'
      )
      expect(number).toEqual(undefined)
    })
  })

  describe('createPullRequest', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockGithubClient.pulls, 'create')
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
              data: mockGithubPullRequestCreateResponse,
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
        owner: organizationName(),
        repo,
        title: 'Add a Widget',
      })
      expect(result.id).toEqual(1234)
      spy.mockRestore()
    })
  })

  describe('getIssueKey', () => {
    it('gets the key from the title if possible', () => {
      const pullRequest = {
        body: '[Jira Tech task](https://example.atlassian.net/browse/ISSUE-789)',
        title: '[ISSUE-456] My Issue',
      } as unknown as Schema.PullRequest
      expect(getIssueKey(pullRequest)).toEqual('ISSUE-456')
    })

    it('gets the key from the body if possible', () => {
      const pullRequest = {
        body: '[Jira Tech task](https://example.atlassian.net/browse/ISSUE-789)',
        title: 'My Issue',
      } as unknown as Schema.PullRequest
      expect(getIssueKey(pullRequest)).toEqual('ISSUE-789')
    })

    it("returns undefined if the key can't be found", () => {
      const pullRequest = {
        body: 'My body',
        title: 'My Issue',
      } as unknown as Schema.PullRequest
      expect(getIssueKey(pullRequest)).toBeUndefined()
    })
  })

  describe('getPullRequest', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockReadClient.pulls, 'get')
        .mockImplementation((_args?: GetPullParams) =>
          Promise.resolve({
            data: mockGithubPullRequest,
          } as OctokitResponse<PullsGetResponseData>)
        )
      const result = await getPullRequest(repo, pull_number)
      expect(spy).toHaveBeenCalledWith(fetchPullParams)
      expect(result?.number).toEqual(pull_number)
      spy.mockRestore()
    })

    it("returns undefined if the branch can't be found", async () => {
      const spy = jest
        .spyOn(mockReadClient.pulls, 'get')
        .mockImplementation((_args?: GetPullParams) => {
          throw new Error('Pull request not found')
        })
      const result = await getPullRequest(repo, pull_number)
      expect(spy).toHaveBeenCalledWith(fetchPullParams)
      expect(result).toEqual(undefined)
      spy.mockRestore()
    })
  })

  describe('listPullRequestCommits', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockReadClient.pulls, 'listCommits')
        .mockReturnValue(
          Promise.resolve({
            data: [mockGitCommit],
          } as unknown as OctokitResponse<PullsListCommitsResponseData>)
        )
      const result = await listPullRequestCommits(repo, 123)
      expect(spy).toHaveBeenCalledWith({
        owner: organizationName(),
        pull_number: 123,
        repo,
      })
      expect((result || [])[0].author.login).toEqual('dperrett')
      spy.mockRestore()
    })
  })

  describe('listPullRequestFiles', () => {
    it('calls the Github API', async () => {
      const spy = jest.spyOn(mockReadClient.pulls, 'listFiles').mockReturnValue(
        Promise.resolve({
          data: [mockGitFile],
        } as unknown as OctokitResponse<PullsListFilesResponseData>)
      )
      const result = await listPullRequestFiles(repo, 123)
      expect(spy).toHaveBeenCalledWith({
        owner: organizationName(),
        pull_number: 123,
        repo,
      })
      expect((result || [])[0].filename).toEqual('main.tf')
      spy.mockRestore()
    })
  })

  describe('pullRequestUrl', () => {
    it('returns the URL', () => {
      const expected = 'https://github.com/octokit/actions/pull/123'
      expect(pullRequestUrl('actions', 123)).toEqual(expected)
    })
  })

  describe('reviewPullRequest', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockGithubClient.pulls, 'createReview')
        .mockReturnValue(
          Promise.resolve({
            data: mockGithubPullRequestReviewResponse,
          } as OctokitResponse<PullsCreateReviewResponseData>)
        )
      const result = await reviewPullRequest(repo, 23, 'APPROVE', ':thumbsup:')
      expect(spy).toHaveBeenCalledWith({
        body: ':thumbsup:',
        event: 'APPROVE',
        pull_number: 23,
        owner: organizationName(),
        repo,
      })
      expect(result.id).toEqual(1234)
      spy.mockRestore()
    })
  })

  describe('updatePullRequest', () => {
    it('calls the Github API', async () => {
      const spy = jest
        .spyOn(mockGithubClient.pulls, 'update')
        .mockImplementation(
          (_args?: {
            owner: string
            pull_number: number
            repo: Repository
            title?: string
          }) =>
            Promise.resolve({
              data: mockGithubPullRequestUpdateResponse,
            } as OctokitResponse<PullsUpdateResponseData>)
        )
      const result = await updatePullRequest(repo, 123, {
        title: 'Add a Widget',
      })
      expect(spy).toHaveBeenCalledWith({
        owner: organizationName(),
        pull_number: 123,
        repo,
        title: 'Add a Widget',
      })
      expect(result.id).toEqual(1234)
      spy.mockRestore()
    })
  })
})
