import { useCallback, useEffect, useMemo, useState } from 'react'
import GoogleSignInClient from './GoogleSignInClient'
import {GoogleSignInData} from './GoogleSignInContext'
import loadGoogleSignInClientOpts from './loadGoogleSignInClientOpts'

const useSetupGoogleSignIn = (): GoogleSignInData => {
    const opts = useMemo(() => (loadGoogleSignInClientOpts()), [])
    const [client, setClient] = useState<GoogleSignInClient | undefined>(undefined)
    const [, setUpdateCode] = useState<number>(0)
    const incrementUpdateCode = useCallback(() => {setUpdateCode(c => (c+1))}, [])
    useEffect(() => {
        if (!opts) return
        const c = new GoogleSignInClient(opts)
        c.onSignedInChanged(() => {
            incrementUpdateCode()
        })
        c.initialize().then(() => {
            setClient(c)
        })
    }, [opts, incrementUpdateCode])
    return {
        signedIn: client?.signedIn || false,
        userId: client?.userId as any as string || undefined,
        googleIdToken: client?.idToken || undefined,
        gapi: client?.gapi
    }
}

export default useSetupGoogleSignIn