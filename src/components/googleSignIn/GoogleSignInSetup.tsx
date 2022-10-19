import React, { FunctionComponent, PropsWithChildren } from 'react';
import GoogleSignInContext from './GoogleSignInContext';
import useSetupGoogleSignIn from './useSetupGoogleSignIn';

const GoogleSignInSetup: FunctionComponent<PropsWithChildren> = ({children}) => {
    const googleSignInData = useSetupGoogleSignIn()
    return (
        <GoogleSignInContext.Provider value={googleSignInData}>
            {children}
        </GoogleSignInContext.Provider>
    )
}

export default GoogleSignInSetup