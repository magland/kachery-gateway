import React, { FunctionComponent, useCallback, useContext } from 'react';
import ReactGoogleButton from 'react-google-button';
import GoogleSignInClient from './GoogleSignInClient';
import GoogleSignInContext from './GoogleSignInContext';

type Props = {
    client: GoogleSignInClient
}

export const useSignedIn = () => {
    return useContext(GoogleSignInContext)
}

const GoogleSignIn: FunctionComponent<Props> = ({client}) => {
    const {signedIn} = useSignedIn()
    const gapi = client.gapi

    const handleSignIn = useCallback(() => {
        gapi.auth2.getAuthInstance().signIn();
    }, [gapi])
    const handleSignOut = useCallback(() => {
        gapi.auth2.getAuthInstance().signOut()
    }, [gapi])

    return <div>
        {
            <span>
                {
                    (gapi) ? (
                        signedIn ? (
                            <span>
                                <button onClick={handleSignOut}>Sign out</button>
                            </span>
                        ) : (
                            <ReactGoogleButton onClick={handleSignIn} />
                        )
                    ) : gapi === undefined ? (
                        <div>Loading google api</div>
                    ) : (
                        <div>Unable to load google api</div>
                    )
                }
            </span>
        }
    </div>
}

export default GoogleSignIn