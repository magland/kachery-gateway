import { Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import { FunctionComponent, useCallback, useMemo } from 'react';
import guiApiRequest from '../common/guiApiRequest';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import useErrorMessage from '../errorMessageContext/useErrorMessage';
import { useGithubAuth } from '../GithubAuth/useGithubAuth';
import { SetZoneInfoRequest } from '../types/GuiRequest';
import EditableTextField from './EditableTextField';
import useZones from './useZones';
import useRoute from './useRoute';

type Props = {
    zoneName: string
}

const ZonePage: FunctionComponent<Props> = ({zoneName}) => {
    const { zoneInfos, refreshZones } = useZones()
    const { route, setRoute } = useRoute()

    const zoneInfo = useMemo(() => (
        (zoneInfos || []).filter(zoneInfo => (zoneInfo.zone === zoneName))[0]
    ), [zoneInfos, zoneName])

    const {userId, accessToken} = useGithubAuth()

    const { setErrorMessage } = useErrorMessage()

    const handleChange = useCallback((bucketName: string | undefined, directory: string | undefined) => {
        if (!userId) return
        if (!accessToken) return
        ;(async () => {
            const req: SetZoneInfoRequest = {
                type: 'setZoneInfo',
                zone: zoneName,
                bucketName,
                directory,
                auth: {
                    userId, githubAccessToken: accessToken
                }
            }
            await guiApiRequest(req, {reCaptcha: true, setErrorMessage})
            refreshZones()
        })()
    }, [zoneName, userId, accessToken, refreshZones, setErrorMessage])

    const tableData = useMemo(() => {
        if (!zoneInfo) return undefined
        return [
            { key: 'zoneName', label: 'Zone name', value: zoneInfo.zone },
            {
                key: 'bucketName',
                label: 'Bucket name',
                value: (
                    <EditableTextField
                        value={zoneInfo.bucketName}
                        onChange={(newBucketName) => handleChange(newBucketName, undefined)}
                    />
                )
            },
            {
                key: 'directory',
                label: 'Directory',
                value: (
                    <EditableTextField
                        value={zoneInfo.directory}
                        onChange={(newDirectory) => handleChange(undefined, newDirectory)}
                    />
                )
            },
            { key: 'ownerId', label: 'Owner', value: zoneInfo.ownerId.toString() }
        ]
    }, [zoneInfo, handleChange])

    const handleBack = useCallback(() => {
        setRoute({page: 'zones', zone: route.zone})
    }, [setRoute, route.zone])

    if (!zoneInfos) {
        return <span>Loading...</span>
    }

    if (!zoneInfo) {
        return <span style={{color: 'red'}}>Zone not found for user {userId}: {zoneName}</span>
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
            <button onClick={() => {setRoute({page: 'admin', zone: zoneName})}}>
                Go to admin page
            </button>
        </div>
    )
}

export default ZonePage