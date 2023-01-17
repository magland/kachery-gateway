import { FunctionComponent, useCallback } from 'react';
import useErrorMessage from '../errorMessageContext/useErrorMessage';
import { useGithubAuth } from '../GithubAuth/useGithubAuth';
import useWindowDimensions from '../misc/useWindowDimensions';
import AdminPage from './AdminPage/AdminPage';
import ApplicationBar from './ApplicationBar/ApplicationBar';
import ClientPage from './ClientPage';
import ClientsTable from './ClientsTable';
import GitHubAuthPage from './GitHubAuthPage';
import HomePage from './HomePage';
import LeftPanel from './LeftPanel';
import logoFull from './logoFull.png';
import './MainWindow.css';
import RegisterClientPage from './RegisterClientPage';
import ResourcePage from './ResourcePage';
import ResourcesTable from './ResourcesTable';
import useRoute from './useRoute';

type Props = {
}

const MainWindow: FunctionComponent<Props> = () => {
    const {route, setRoute} = useRoute()
    const {width, height} = useWindowDimensions()

    const handleHome = useCallback(() => {
        setRoute({page: 'home', zone: route.zone})
    }, [setRoute, route.zone])

    const {errorMessage} = useErrorMessage()

    const { signedIn } = useGithubAuth()

    const W = width - 290
    const H = height - 50

    const applicationBarHeight = (route.page !== 'github-auth') ? 50 : 0
    const leftPanelWidth = (route.page !== 'github-auth') ? 250 : 0

    return (
        <div>
            <div>
                {
                    (applicationBarHeight > 0) && (
                        <ApplicationBar
                            title={"Kachery Gateway"}
                            onHome={handleHome}
                            logo={logoFull}
                        />
                    )
                }
            </div>
            <div style={{position: 'absolute', top: applicationBarHeight}}>
                {
                    leftPanelWidth > 0 && (
                        <div style={{position: 'absolute', left: 0, width: leftPanelWidth}}>
                            <LeftPanel
                                width={leftPanelWidth}
                                height={height - 50}
                            />
                        </div>
                    )
                }
                <div style={{position: 'absolute', left: leftPanelWidth + 20, width: W, height: H, overflowY: 'auto'}}>
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
                                zone={route.zone}
                            />
                        ) : (route.page === 'home') ? (
                            <HomePage />
                        ) : (route.page === 'github-auth') ? (
                            <GitHubAuthPage />
                        ) : signedIn ? (
                            route.page === 'clients' ? (
                                <ClientsTable />
                            ) : route.page === 'resources' ? (
                                <ResourcesTable />
                            ) : route.page === 'admin' ? (
                                <AdminPage
                                    width={W}
                                    height={H}
                                />
                            ) : route.page === 'client' ? (
                                <ClientPage
                                    clientId={route.clientId}
                                />
                            ) : route.page === 'resource' ? (
                                <ResourcePage
                                    resourceName={route.resourceName}
                                />
                            ) : <span>Unexpected page {(route as any).page}</span>
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