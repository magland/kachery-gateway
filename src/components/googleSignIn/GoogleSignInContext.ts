import React from 'react'

export type GoogleSignInData = {
    signedIn: boolean
    userId?: string,
    googleIdToken?: string
    signIn: () => void
    signOut: () => void
}

const dummyGoogleSignInData: GoogleSignInData = {signedIn: false, signIn: () => {}, signOut: () => {}}

const GoogleSignInContext = React.createContext<GoogleSignInData>(dummyGoogleSignInData)

export default GoogleSignInContext