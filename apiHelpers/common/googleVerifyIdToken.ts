import axios from 'axios';

const REACT_APP_GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
if (!REACT_APP_GOOGLE_CLIENT_ID) {
    throw Error('Environment variable not set: REACT_APP_CLIENT_ID')
}

const googleVerifyIdToken = async (userId: string, token?: string) => {
  if (!token) throw Error('No google ID token')

  // note: I don't know how to verify that we have the correct client ID
  // something should be compared against REACT_APP_GOOGLE_CLIENT_ID

  const resp = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`)
  const verifiedUserId = resp.data.email
  if (verifiedUserId !== userId) {
    throw Error('User ID does not match verified user ID in googleVerifyIdToken')
  }
  return verifiedUserId
}

export default googleVerifyIdToken