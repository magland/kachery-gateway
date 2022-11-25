import axios from 'axios'
import ObjectCache from '../gatewayRequestHandlers/ObjectCache'

const accessTokenCache = new ObjectCache<{userId: string}>(1000 * 60 * 30)

const githubVerifyAccessToken = async (userId: string, accessToken?: string) => {
  if (!accessToken) throw Error('No github access token *')
  const a = accessTokenCache.get(accessToken)
  let accessTokenUserId: string
  if (a) {
    accessTokenUserId = a.userId
  }
  else {
    const resp = await axios.get(`https://api.github.com/user`, {headers: {Authorization: `token ${accessToken}`}})
    accessTokenUserId = resp.data.login
    accessTokenCache.set(accessToken, {userId: accessTokenUserId})
  }
  if (accessTokenUserId === userId) {
    return accessTokenUserId as string
  }
  else {
    throw Error('Incorrect user ID for access token')
  }
}

export default githubVerifyAccessToken