import fetch from 'node-fetch'

import { getCredentialsByEmail } from '@sr-services/Credentials'

const { Response } = jest.requireActual('node-fetch')

jest.mock('node-fetch', () => jest.fn())

// The email address to look up credentials for.
const email = 'user@example.com'

// The URL with the encoded 'user@example.com' email address.
const url =
  'https://users.example.com/api/private/credentials/dXNlckBleGFtcGxlLmNvbQ=='

// HMAC signature for the test email address.
const signature =
  'sha256=e3b2e2d247a3560b2fb00e152ac450bcf915e9c780dfabf28ed6666effecd6e1'

describe('Credentials', () => {
  describe('getCredentialsByEmail', () => {
    it('calls the credential API', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ github_token: 'my-github-token', status: 'ok' })
        )
      )
      const result = await getCredentialsByEmail(email)
      expect(result.github_token).toEqual('my-github-token')
      expect(fetch).toHaveBeenCalledWith(url, {
        headers: { 'Shuttlerock-Signature': signature },
      })
    })

    it('throws an error if the API returns an error', () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'forbidden' }))
      )
      getCredentialsByEmail(email).catch(err => {
        expect(err.message).toEqual(
          `Could not get credentials for the user ${email}`
        )
      })
    })
  })
})
