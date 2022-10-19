import { AppBar, Button, Toolbar } from '@material-ui/core';
import { FunctionComponent, useCallback } from 'react';
import { useSignedIn } from '../../components/googleSignIn/GoogleSignIn';
import useRoute from '../useRoute';

const appBarHeight = 50

type Props = {
    title: string
    logo?: any
    onHome?: () => void
}

const ApplicationBar: FunctionComponent<Props> = ({ title, logo, onHome }) => {
    const {signedIn, userId, gapi} = useSignedIn()
    const {setRoute} = useRoute()

    const handleLogin = useCallback(() => {
        gapi.auth2.getAuthInstance().signIn();
    }, [gapi])
    const handleLogout = useCallback(() => {
        gapi.auth2.getAuthInstance().signOut()
        setRoute({page: 'home'})
    }, [gapi, setRoute])

    return (
        <span>
            <AppBar position="static" style={{height: appBarHeight, color: 'white', background: 'rgb(22, 66, 22)', borderBottom: "solid 1px #444444"}}>
                <Toolbar>
                {
                    logo && (<img src={logo} alt="logo" height={30} style={{paddingBottom: 5, cursor: 'pointer'}} onClick={onHome} />)
                }
                {/* &nbsp;&nbsp;&nbsp;<div style={homeButtonStyle} onClick={onHome}>{title}</div> */}
                <span style={{marginLeft: 'auto'}} />
                {
                    signedIn && (
                        <span style={{fontFamily: 'courier', color: 'lightgray'}}>{userId}</span>
                    )
                }
                {
                    signedIn ? (
                        <Button color="inherit" onClick={handleLogout}>Sign out</Button>
                    ) : (
                        <Button color="inherit" onClick={handleLogin}>Sign in</Button>
                    )
                }
                </Toolbar>
            </AppBar>
        </span>
    )
}

export default ApplicationBar