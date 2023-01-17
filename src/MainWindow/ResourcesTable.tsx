import { IconButton } from '@material-ui/core';
import { AddCircle, Refresh } from '@material-ui/icons';
import { FunctionComponent, useCallback, useMemo } from 'react';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import NiceTable from '../components/NiceTable/NiceTable';
import useVisible from '../misc/useVisible';
import CreateResourceControl from './CreateResourceControl';
import useResources from './useResources';
import useRoute from './useRoute';

type Props = {
}

const ResourcesTable: FunctionComponent<Props> = () => {
    const createResourceVisible = useVisible()

    const {route, setRoute} = useRoute()

    const { resources, refreshResources, deleteResource, addResource } = useResources()

    const columns = useMemo(() => ([
        {
            key: 'resource',
            label: 'Resource'
        },
        {
            key: 'ownerId',
            label: 'Owner'
        }
    ]), [])

    const rows = useMemo(() => (
        (resources || []).map((resource) => {
            return {
                key: resource.resourceName,
                columnValues: {
                    resource: {
                        text: resource.resourceName,
                        element: <Hyperlink onClick={() => {setRoute({page: 'resource', resourceName: resource.resourceName, zone: route.zone})}}>
                            {resource.resourceName}
                        </Hyperlink>
                    },
                    ownerId: resource.ownerId
                }
            }
        })
    ), [resources, setRoute, route.zone])

    const handleDeleteResource = useCallback((resourceName: string) => {
        deleteResource(resourceName)
    }, [deleteResource])

    const handleCreateResource = useCallback((resourceName: string, proxyUrl: string) => {
        addResource(resourceName, proxyUrl, {navigateToResourcePage: true})
    }, [addResource])

    return (
        <div style={{maxWidth: 1000}}>
            <div className="PageHeading">Resources</div>
            <div className="PageBlurb">
            </div>
            <IconButton onClick={refreshResources} title="Refresh resources"><Refresh /></IconButton>
            <IconButton onClick={createResourceVisible.show} title="Create resource"><AddCircle /></IconButton>
            {
                createResourceVisible.visible && (
                    <CreateResourceControl
                        onCreate={handleCreateResource}
                        onClose={createResourceVisible.hide}
                    />
                )
            }
            <NiceTable
                columns={columns}
                rows={rows}
                onDeleteRow={handleDeleteResource}
            />
            {
                !resources ? (
                    <div>Loading resources...</div>
                ) : <span />
            }
        </div>
    )
}

export default ResourcesTable