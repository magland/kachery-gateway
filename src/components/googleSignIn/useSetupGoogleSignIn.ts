import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleSignInData } from './GoogleSignInContext'

const loadUserIdFromToken = async (token: string) => {
    const resp = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`)
    const userId = resp.data.email
    return userId
}

const useSetupGoogleSignIn = (): GoogleSignInData => {
    const [googleIdToken, setGoogleIdToken] = useState<string | undefined>()
    const [userId, setUserId] = useState<string | undefined>()
    useEffect(() => {
        const x = localStorage.getItem('google-access-token')
        if (!x) return
        let a: {expiresTimestamp: number, accessToken: string}
        try {
            a = JSON.parse(x)
        }
        catch(err) {
            console.warn('Problem parsing access token from local storage')
            return
        }
        const ts = a.expiresTimestamp
        if (ts <= Date.now()) {
            console.warn('Access token expired')
            return
        }
        loadUserIdFromToken(a.accessToken).then(id => {
            setGoogleIdToken(a.accessToken)
            setUserId(id)
        })
    }, [])
    const signIn = useGoogleLogin({
        onSuccess: tokenResponse => {
            loadUserIdFromToken(tokenResponse.access_token).then(id => {
                localStorage.setItem('google-access-token', JSON.stringify({
                    accessToken: tokenResponse.access_token,
                    expiresTimestamp: Date.now() + tokenResponse.expires_in * 1000
                }))
                setGoogleIdToken(tokenResponse.access_token)
                setUserId(id)
            })
        }
    });
    const signOut = useCallback(() => {
        setUserId(undefined)
        setGoogleIdToken(undefined)
        localStorage.setItem('google-access-token', '')
    }, [])

    const signedIn = useMemo(() => (userId !== undefined), [userId])

    return {
        signedIn,
        userId,
        googleIdToken,
        signIn,
        signOut
    }
}

export default useSetupGoogleSignIn