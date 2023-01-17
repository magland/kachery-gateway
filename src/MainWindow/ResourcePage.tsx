import { Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import { FunctionComponent, useCallback, useMemo } from 'react';
import guiApiRequest from '../common/guiApiRequest';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import useErrorMessage from '../errorMessageContext/useErrorMessage';
import { useGithubAuth } from '../GithubAuth/useGithubAuth';
import { SetResourceInfoRequest } from '../types/GuiRequest';
import EditableTextField from './EditableTextField';
import useResources from './useResources';
import useRoute from './useRoute';

type Props = {
    resourceName: string
}

const ResourcePage: FunctionComponent<Props> = ({resourceName}) => {
    const { resources, refreshResources } = useResources()
    const { route, setRoute } = useRoute()

    const resource = useMemo(() => (
        (resources || []).filter(resource => (resource.resourceName === resourceName))[0]
    ), [resources, resourceName])

    const {userId, accessToken} = useGithubAuth()

    const { setErrorMessage } = useErrorMessage()

    const handleProxyUrlChange = useCallback((proxyUrl: string) => {
        if (!userId) return
        if (!accessToken) return
        ;(async () => {
            const req: SetResourceInfoRequest = {
                type: 'setResourceInfo',
                resourceName,
                proxyUrl,
                zone: route.zone,
                auth: {
                    userId, githubAccessToken: accessToken
                }
            }
            await guiApiRequest(req, {reCaptcha: true, setErrorMessage})
            refreshResources()
        })()
    }, [resourceName, route.zone, userId, accessToken, refreshResources, setErrorMessage])

    const tableData = useMemo(() => {
        if (!resource) return undefined
        return [
            { key: 'resourceName', label: 'Resource ID', value: resource.resourceName },
            {
                key: 'proxyUrl',
                label: 'Proxy URL',
                value: (
                    <EditableTextField
                        value={resource.proxyUrl}
                        onChange={handleProxyUrlChange}
                    />
                )
            },
            { key: 'ownerId', label: 'Owner', value: resource.ownerId.toString() },
            { key: 'timestampCreated', label: 'Created', value: `${new Date(resource.timestampCreated)}` }
        ]
    }, [resource, handleProxyUrlChange])

    const handleBack = useCallback(() => {
        setRoute({page: 'resources', zone: route.zone})
    }, [setRoute, route.zone])

    if (!resources) {
        return <span>Loading...</span>
    }

    if (!resource) {
        return <span style={{color: 'red'}}>Resource not found for user {userId}: {resourceName}</span>
    }


    if (!tableData) return <div />
    return (
        <div>
            <p /><hr /><p />
            <Hyperlink onClick={handleBack}>Back</Hyperlink>
            <Table>
                <TableBody>
                    {
                        tableData.map(x => (
                            <TableRow key={x.key}>
                                <TableCell>{x.label}: </TableCell>
                                <TableCell style={{wordBreak: 'break-word'}}>{x.value}</TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
            <p /><hr /><p />
        </div>
    )
}

export default ResourcePage