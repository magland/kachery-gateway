import { GoogleOAuthProvider } from '@react-oauth/google';
import { FunctionComponent, PropsWithChildren } from 'react';
import GoogleSignInContext from './GoogleSignInContext';
import useSetupGoogleSignIn from './useSetupGoogleSignIn';

const REACT_APP_GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
if (!REACT_APP_GOOGLE_CLIENT_ID) {
    throw Error('Environment variable not set: REACT_APP_GOOGLE_CLIENT_ID')
}

const GoogleSignInSetup: FunctionComponent<PropsWithChildren> = ({children}) => {
    // const googleSignInData = useSetupGoogleSignIn()
    // return (
    //     <GoogleSignInContext.Provider value={googleSignInData}>
    //         {children}
    //     </GoogleSignInContext.Provider>
    // )
    return (
        <GoogleOAuthProvider clientId={REACT_APP_GOOGLE_CLIENT_ID}>
            <GoogleSignInSetup2>
                {children}
            </GoogleSignInSetup2>
        </GoogleOAuthProvider>
    )
}

const GoogleSignInSetup2: FunctionComponent<PropsWithChildren> = ({children}) => {
    const googleSignInData = useSetupGoogleSignIn()
    return (
        <GoogleSignInContext.Provider value={googleSignInData}>
            {children}
        </GoogleSignInContext.Provider>
    )
}

export default GoogleSignInSetup