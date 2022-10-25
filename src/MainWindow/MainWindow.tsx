import useWindowDimensions from '../misc/useWindowDimensions';
import { FunctionComponent, useCallback } from 'react';
import './MainWindow.css';
import useRoute from './useRoute';
import useErrorMessage from '../errorMessageContext/useErrorMessage';
import logoFull from './logoFull.png'
import ApplicationBar from './ApplicationBar/ApplicationBar';
import LeftPanel from './LeftPanel';
import HomePage from './HomePage';
import AdminPage from './AdminPage';
import ClientsTable from './ClientsTable';
import RegisterClientPage from './RegisterClientPage';
import ClientPage from './ClientPage';
import useSignedIn from '../components/googleSignIn/useSignedIn';

type Props = {
}

const MainWindow: FunctionComponent<Props> = () => {
    const {route, setRoute} = useRoute()
    const {width, height} = useWindowDimensions()

    const handleHome = useCallback(() => {
        setRoute({page: 'home'})
    }, [setRoute])

    const {errorMessage} = useErrorMessage()

    const { signedIn } = useSignedIn()

    const W = width - 290
    const H = height - 50

    return (
        <div>
            <div>
                <ApplicationBar
                    title={"Kachery Gateway"}
                    onHome={handleHome}
                    logo={logoFull}
                />
            </div>
            <div style={{position: 'absolute', top: 50}}>
                <div style={{position: 'absolute', left: 0, width: 250}}>
                    <LeftPanel
                        width={250}
                        height={height - 50}
                    />
                </div>
                <div style={{position: 'absolute', left: 270, width: W, height: H, overflowY: 'auto'}}>
                    {
                        errorMessage ? (
                            <span style={{color: 'red'}}>{errorMessage}</span>
                        ) : <span />
                    }
                    {
                        route.page === 'registerClient' ? (
                            <RegisterClientPage
                                clientId={route.clientId}
                                signature={route.signature}
                                label={route.label}
                            />
                        ) : (route.page === 'home') ? (
                            <HomePage />
                        ) : signedIn ? (
                            route.page === 'clients' ? (
                                <ClientsTable />
                            ) : route.page === 'admin' ? (
                                <AdminPage
                                    width={W}
                                    height={H}
                                />
                            ) : route.page === 'client' ? (
                                <ClientPage
                                    clientId={route.clientId}
                                />
                            ) : <span />
                        ) : (
                            <div>
                                <p />
                                <div className='PageBlurb'>You must sign in above.</div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default MainWindow