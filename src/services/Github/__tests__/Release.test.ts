import * as core from '@actions/core'
import {
  OctokitResponse,
  PullsListResponseData,
  ReposCompareCommitsResponseData,
  ReposCreateReleaseResponseData,
} from '@octokit/types'

import {
  DevelopBranchName,
  InProgressLabel,
  MasterBranchName,
  ReleaseBranchName,
  ReleaseLabel,
} from '@sr-services/Constants'
import * as Credentials from '@sr-services/Credentials'
import * as Branch from '@sr-services/Github/Branch'
import * as Git from '@sr-services/Github/Git'
import * as Label from '@sr-services/Github/Label'
import * as PullRequest from '@sr-services/Github/PullRequest'
import {
  createReleasePullRequest,
  createReleaseTag,
} from '@sr-services/Github/Release'
import * as Repository from '@sr-services/Github/Repository'
import { githubWriteToken, organizationName } from '@sr-services/Inputs'
import * as Slack from '@sr-services/Slack'
import {
  mockCredentials,
  mockGitCommit,
  mockGithubClient,
  mockGithubCompareCommits,
  mockGithubBranch,
  mockGithubPullRequest,
  mockGithubRelease,
  mockGithubRepository,
  mockReadClient,
} from '@sr-tests/Mocks'

const email = 'user@example.com'

jest.mock('@sr-services/Github/Branch', () => ({
  deleteBranch: jest.fn(),
  getBranch: jest.fn(),
  getMasterBranch: jest.fn(),
}))

jest.mock('@sr-services/Github/Client', () => ({
  client: () => mockGithubClient,
  readClient: () => mockReadClient,
}))

jest.mock('@sr-services/Credentials', () => ({
  fetchCredentials: jest.fn(),
}))

jest.mock('@sr-services/Github/Git', () => ({
  createGitBranch: jest.fn(),
}))

jest.mock('@sr-services/Github/Label', () => ({
  setLabels: jest.fn(),
}))

jest.mock('@sr-services/Github/PullRequest', () => ({
  assignOwners: jest.fn(),
  createPullRequest: jest.fn(),
  extractPullRequestNumber: (message: string) =>
    parseInt(message.replace(/^.*\[#(\d+)\].*$/, '$1'), 10) || undefined,
  getPullRequest: jest.fn(),
  pullRequestUrl: jest.fn(),
  updatePullRequest: jest.fn(),
}))

jest.mock('@sr-services/Github/Repository', () => ({
  compareCommits: jest.fn(),
  repositoryUrl: jest.fn(),
}))

jest.mock('@sr-services/Slack', () => ({
  reportError: jest.fn(),
  reportInfo: jest.fn(),
  sendUserMessage: jest.fn(),
}))

describe('Release', () => {
  describe('createReleasePullRequest', () => {
    let assignOwnersSpy: jest.SpyInstance
    let compareCommitsSpy: jest.SpyInstance
    let createGitBranchSpy: jest.SpyInstance
    let createPullRequestSpy: jest.SpyInstance
    let deleteBranchSpy: jest.SpyInstance
    let errorSpy: jest.SpyInstance
    let fetchCredentialsSpy: jest.SpyInstance
    let getBranchSpy: jest.SpyInstance
    let getMasterBranchSpy: jest.SpyInstance
    let getPullRequestSpy: jest.SpyInstance
    let infoSpy: jest.SpyInstance
    let listPullsSpy: jest.SpyInstance
    let pullRequestUrlSpy: jest.SpyInstance
    let reportErrorSpy: jest.SpyInstance
    let reportInfoSpy: jest.SpyInstance
    let repositoryUrlSpy: jest.SpyInstance
    let setLabelsSpy: jest.SpyInstance
    let updatePullRequestSpy: jest.SpyInstance

    beforeEach(() => {
      assignOwnersSpy = jest.spyOn(PullRequest, 'assignOwners')
      compareCommitsSpy = jest
        .spyOn(Repository, 'compareCommits')
        .mockReturnValue(Promise.resolve(mockGithubCompareCommits))
      createGitBranchSpy = jest.spyOn(Git, 'createGitBranch')
      createPullRequestSpy = jest.spyOn(PullRequest, 'createPullRequest')
      deleteBranchSpy = jest.spyOn(Branch, 'deleteBranch')
      errorSpy = jest
        .spyOn(core, 'error')
        .mockImplementation((_message: string | Error) => undefined)
      fetchCredentialsSpy = jest
        .spyOn(Credentials, 'fetchCredentials')
        .mockReturnValue(Promise.resolve(mockCredentials))
      getBranchSpy = jest
        .spyOn(Branch, 'getBranch')
        .mockReturnValue(Promise.resolve(mockGithubBranch))
      getMasterBranchSpy = jest
        .spyOn(Branch, 'getMasterBranch')
        .mockReturnValue(Promise.resolve(mockGithubBranch))
      getPullRequestSpy = jest.spyOn(PullRequest, 'getPullRequest')
      infoSpy = jest
        .spyOn(core, 'info')
        .mockImplementation((_message: string | Error) => undefined)
      listPullsSpy = jest.spyOn(mockReadClient.pulls, 'list').mockReturnValue(
        Promise.resolve({
          data: [mockGithubPullRequest],
        } as unknown as OctokitResponse<PullsListResponseData>)
      )
      pullRequestUrlSpy = jest.spyOn(PullRequest, 'pullRequestUrl')
      reportErrorSpy = jest.spyOn(Slack, 'reportError')
      reportInfoSpy = jest.spyOn(Slack, 'reportInfo')
      repositoryUrlSpy = jest.spyOn(Repository, 'repositoryUrl')
      setLabelsSpy = jest.spyOn(Label, 'setLabels')
      updatePullRequestSpy = jest
        .spyOn(PullRequest, 'updatePullRequest')
        .mockReturnValue(Promise.resolve(mockGithubPullRequest))
    })

    afterEach(() => {
      assignOwnersSpy.mockRestore()
      compareCommitsSpy.mockRestore()
      createGitBranchSpy.mockRestore()
      createPullRequestSpy.mockRestore()
      deleteBranchSpy.mockRestore()
      errorSpy.mockRestore()
      fetchCredentialsSpy.mockRestore()
      getBranchSpy.mockRestore()
      getMasterBranchSpy.mockRestore()
      getPullRequestSpy.mockRestore()
      infoSpy.mockRestore()
      listPullsSpy.mockRestore()
      pullRequestUrlSpy.mockRestore()
      reportErrorSpy.mockRestore()
      reportInfoSpy.mockRestore()
      repositoryUrlSpy.mockRestore()
      setLabelsSpy.mockRestore()
      updatePullRequestSpy.mockRestore()
    })

    it(`reports an error if the ${DevelopBranchName} branch cannot be found`, async () => {
      getBranchSpy.mockReturnValue(Promise.resolve(undefined))
      await createReleasePullRequest(email, mockGithubRepository)
      const message = `Branch '${DevelopBranchName}' could not be found for repository webhooks - giving up`
      expect(reportErrorSpy).toHaveBeenLastCalledWith(
        mockCredentials.slack_id,
        message
      )
    })

    it(`reports an error if the ${MasterBranchName} branch cannot be found`, async () => {
      getBranchSpy
        .mockReturnValueOnce(Promise.resolve(mockGithubBranch))
        .mockReturnValueOnce(Promise.resolve(undefined))
      getMasterBranchSpy.mockReturnValue(Promise.resolve(undefined))
      await createReleasePullRequest(email, mockGithubRepository)
      const message =
        'Master branch could not be found for repository webhooks - giving up'
      expect(reportErrorSpy).toHaveBeenLastCalledWith(
        mockCredentials.slack_id,
        message
      )
    })

    it(`does nothing if the ${MasterBranchName} branch already has the latest release`, async () => {
      const response = Promise.resolve({
        commits: [],
        total_commits: 0,
      } as unknown as ReposCompareCommitsResponseData)
      compareCommitsSpy.mockReturnValue(response)
      await createReleasePullRequest(email, mockGithubRepository)
      const message = `Branch '${MasterBranchName}' already contains the latest release - nothing to do`
      expect(reportInfoSpy).toHaveBeenLastCalledWith(
        mockCredentials.slack_id,
        message
      )
    })

    it('returns an existing pull request if one exists', async () => {
      updatePullRequestSpy.mockReturnValue(Promise.resolve(undefined))
      listPullsSpy.mockReturnValue(
        Promise.resolve({
          data: [mockGithubPullRequest],
        } as unknown as OctokitResponse<PullsListResponseData>)
      )
      await createReleasePullRequest(email, mockGithubRepository)
      const message = `An existing release pull request was found (${mockGithubRepository.name}#${mockGithubPullRequest.number}) - updating the release notes...`
      expect(infoSpy).toHaveBeenLastCalledWith(message)
    })

    it('reports an error if the pull request cannot be created', async () => {
      updatePullRequestSpy.mockReturnValue(Promise.resolve(undefined))
      createPullRequestSpy.mockReturnValue(Promise.resolve(undefined))
      await createReleasePullRequest(email, mockGithubRepository)
      const message = `An unknown error occurred while creating a release pull request for repository '${mockGithubRepository.name}'`
      expect(reportErrorSpy).toHaveBeenLastCalledWith(
        mockCredentials.slack_id,
        message
      )
    })

    it('creates a release pull request', async () => {
      listPullsSpy.mockReturnValue(
        Promise.resolve({
          data: [],
        } as unknown as OctokitResponse<PullsListResponseData>)
      )
      await createReleasePullRequest(email, mockGithubRepository)
      const message =
        'No existing release pull request was found - creating it...'
      expect(infoSpy).toHaveBeenLastCalledWith(message)
      expect(createPullRequestSpy).toHaveBeenCalledWith(
        mockGithubRepository.name,
        MasterBranchName,
        ReleaseBranchName,
        expect.stringMatching(/^Release Candidate /), // Pull request title.
        expect.stringMatching(/## Release Candidate /), // Pull request body.
        githubWriteToken()
      )
    })

    it('assigns an owner', async () => {
      await createReleasePullRequest(email, mockGithubRepository)
      expect(assignOwnersSpy).toHaveBeenCalledWith(
        mockGithubRepository.name,
        mockGithubPullRequest.number,
        ['my-github-username']
      )
    })

    it('sets labels', async () => {
      const noLabels = { ...mockGithubPullRequest, labels: [] }
      updatePullRequestSpy = jest
        .spyOn(PullRequest, 'updatePullRequest')
        .mockReturnValue(Promise.resolve(noLabels))
      await createReleasePullRequest(email, mockGithubRepository)
      expect(setLabelsSpy).toHaveBeenCalledWith(
        mockGithubRepository.name,
        mockGithubPullRequest.number,
        [InProgressLabel, ReleaseLabel]
      )
    })

    it('handles commit authors with no Github login', async () => {
      listPullsSpy.mockReturnValue(
        Promise.resolve({
          data: [],
        } as unknown as OctokitResponse<PullsListResponseData>)
      )
      compareCommitsSpy.mockReturnValue(
        Promise.resolve({
          commits: [{ ...mockGitCommit, author: { login: null } }],
          total_commits: 1,
        } as unknown as ReposCompareCommitsResponseData)
      )
      await createReleasePullRequest(email, mockGithubRepository)
      expect(createPullRequestSpy).toHaveBeenCalled()
    })

    it('handles commits with no author', async () => {
      listPullsSpy.mockReturnValue(
        Promise.resolve({
          data: [],
        } as unknown as OctokitResponse<PullsListResponseData>)
      )
      compareCommitsSpy.mockReturnValue(
        Promise.resolve({
          commits: [{ ...mockGitCommit, author: null }],
          total_commits: 1,
        } as unknown as ReposCompareCommitsResponseData)
      )
      await createReleasePullRequest(email, mockGithubRepository)
      expect(createPullRequestSpy).toHaveBeenCalled()
    })
  })

  describe('createReleaseTag', () => {
    let getMasterBranchSpy: jest.SpyInstance

    beforeEach(() => {
      getMasterBranchSpy = jest
        .spyOn(Branch, 'getMasterBranch')
        .mockReturnValue(Promise.resolve(mockGithubBranch))
    })

    afterEach(() => {
      getMasterBranchSpy.mockRestore()
    })

    it('calls the Github API', async () => {
      const repo = 'my-repo'
      const createReleaseSpy = jest
        .spyOn(mockGithubClient.repos, 'createRelease')
        .mockReturnValue(
          Promise.resolve({
            data: mockGithubRelease,
          } as unknown as OctokitResponse<ReposCreateReleaseResponseData>)
        )
      const result = await createReleaseTag(
        repo,
        mockGithubRelease.tag_name,
        'Energetic Eagle',
        'My release notes'
      )
      expect(createReleaseSpy).toHaveBeenCalledWith({
        body: 'My release notes',
        draft: false,
        name: mockGithubRelease.name,
        owner: organizationName(),
        repo,
        tag_name: mockGithubRelease.tag_name,
        target_commitish: MasterBranchName,
      })
      expect(result?.name).toEqual(mockGithubRelease.name)
      createReleaseSpy.mockRestore()
    })
  })
})
