import { error, info, setFailed } from '@actions/core'
import { context } from '@actions/github'
import Schema from '@octokit/webhooks-types'

import { rebase } from '@sr-services/Github/Rebase'

/**
 * Runs whenever a commit is added to a pull request.
 *
 * Checks if the Pull request title starts with [Epic]. If so, it rebases the PR.
 */
export const run = async (): Promise<void> => {
  const {
    payload: { pull_request, repository },
  } = (await context) as unknown as {
    payload: Schema.PullRequestEvent
  }

  if (!pull_request.title.startsWith('[Epic] ')) {
    info(
      `${repository.name}#${pull_request.number} is not an epic PR - ignoring`
    )
    return
  }

  await rebase(
    repository.owner.login,
    repository.name,
    pull_request.head.ref,
    pull_request.base.ref
  )
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run().catch(err => {
  error(err)
  error(err.stack)
  setFailed(err.message)
})
