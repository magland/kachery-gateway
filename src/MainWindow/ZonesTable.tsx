import { IconButton } from '@material-ui/core';
import { AddCircle, Refresh } from '@material-ui/icons';
import { FunctionComponent, useCallback, useMemo } from 'react';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import NiceTable from '../components/NiceTable/NiceTable';
import useVisible from '../misc/useVisible';
import CreateZoneControl from './CreateZoneControl';
import useZones from './useZones';
import useRoute from './useRoute';

type Props = {
}

const ZonesTable: FunctionComponent<Props> = () => {
    const createZoneVisible = useVisible()

    const {setRoute} = useRoute()

    const { zoneInfos, refreshZones, deleteZone, addZone } = useZones()

    const columns = useMemo(() => ([
        {
            key: 'zone',
            label: 'Zone'
        },
        {
            key: 'ownerId',
            label: 'Owner'
        },
        {
            key: 'bucketName',
            label: 'Bucket'
        },
        {
            key: 'directory',
            label: 'Directory'
        }
    ]), [])

    const rows = useMemo(() => (
        (zoneInfos || []).map((zoneInfo) => {
            return {
                key: zoneInfo.zone,
                columnValues: {
                    zone: {
                        text: zoneInfo.zone,
                        element: <Hyperlink onClick={() => {setRoute({page: 'zone', zone: zoneInfo.zone})}}>
                            {zoneInfo.zone}
                        </Hyperlink>
                    },
                    ownerId: zoneInfo.ownerId,
                    bucketName: zoneInfo.bucketName,
                    directory: zoneInfo.directory
                }
            }
        })
    ), [zoneInfos, setRoute])

    const handleDeleteZone = useCallback((zoneName: string) => {
        deleteZone(zoneName)
    }, [deleteZone])

    const handleCreateZone = useCallback((zoneName: string, directory: string) => {
        addZone(zoneName, directory, {navigateToZonePage: true})
    }, [addZone])

    return (
        <div style={{maxWidth: 1000}}>
            <div className="PageHeading">Zones</div>
            <div className="PageBlurb">
            </div>
            <IconButton onClick={refreshZones} title="Refresh zones"><Refresh /></IconButton>
            <IconButton onClick={createZoneVisible.show} title="Create zone"><AddCircle /></IconButton>
            {
                createZoneVisible.visible && (
                    <CreateZoneControl
                        onCreate={handleCreateZone}
                        onClose={createZoneVisible.hide}
                    />
                )
            }
            <NiceTable
                columns={columns}
                rows={rows}
                onDeleteRow={handleDeleteZone}
            />
            {
                !zoneInfos ? (
                    <div>Loading zones...</div>
                ) : <span />
            }
        </div>
    )
}

export default ZonesTable