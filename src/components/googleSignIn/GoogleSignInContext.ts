import React from 'react'

export type GoogleSignInData = {
    signedIn: boolean
    userId?: string,
    googleIdToken?: string
    gapi?: any
}

const dummyGoogleSignInData: GoogleSignInData = {signedIn: false}

const GoogleSignInContext = React.createContext<GoogleSignInData>(dummyGoogleSignInData)

export default GoogleSignInContext