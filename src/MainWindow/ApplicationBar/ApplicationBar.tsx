import { AppBar, Toolbar } from '@material-ui/core';
import { FunctionComponent, useCallback, useMemo, useState } from 'react';
import ModalWindow from '../../components/ModalWindow/ModalWindow';
import { useGithubAuth } from '../../GithubAuth/useGithubAuth';
import GitHubAccessControl from './GitHubAccessControl';
import GitHubLoginWindow from './GitHubLoginWindow';

const appBarHeight = 50

type Props = {
    title: string
    logo?: any
    onHome?: () => void
}

export const useModalDialog = () => {
    const [visible, setVisible] = useState<boolean>(false)
    const handleOpen = useCallback(() => {
        setVisible(true)
    }, [])
    const handleClose = useCallback(() => {
        setVisible(false)
    }, [])
    return useMemo(() => ({
        visible,
        handleOpen,
        handleClose
    }), [visible, handleOpen, handleClose])
}

const ApplicationBar: FunctionComponent<Props> = ({ title, logo, onHome }) => {
    const {signedIn, userId} = useGithubAuth()
    const {visible: githubAccessWindowVisible, handleOpen: openGitHubAccessWindow, handleClose: closeGitHubAccessWindow} = useModalDialog()

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
                    <span style={{paddingBottom: 0, color: 'white'}} title={signedIn ? "Manage GitHub sign in" : "Sign in with GitHub"}>
                        <GitHubAccessControl onOpen={openGitHubAccessWindow} />
                        &nbsp;
                    </span>    
                </Toolbar>
            </AppBar>
            <ModalWindow
                open={githubAccessWindowVisible}
                onClose={closeGitHubAccessWindow}
            >
                {/* <GitHubAccessWindow
                    onChange={() => {}}
                /> */}
                <GitHubLoginWindow
                    defaultScope=""
                    allowRepoScope={false}
                    onClose={() => closeGitHubAccessWindow()} onChange={() => {}}
                />
            </ModalWindow>
        </span>
    )
}

export default ApplicationBar