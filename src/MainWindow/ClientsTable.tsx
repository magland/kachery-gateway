import { IconButton } from '@material-ui/core';
import { AddCircle, Refresh } from '@material-ui/icons';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import NiceTable from '../components/NiceTable/NiceTable';
import useVisible from '../misc/useVisible';
import { isNodeId } from '../types/keypair';
import CreateClientControl from './CreateClientControl';
import useClients from './useClients';
import useRoute from './useRoute';

type Props = {
}

const ClientsTable: FunctionComponent<Props> = () => {
    const createClientVisible = useVisible()

    const {setRoute} = useRoute()

    const { clients, refreshClients, deleteClient, createClient } = useClients()

    const columns = useMemo(() => ([
        {
            key: 'client',
            label: 'Client'
        },
        {
            key: 'ownerId',
            label: 'Owner'
        }
    ]), [])

    const rows = useMemo(() => (
        (clients || []).map((client) => {
            return {
                key: client.clientId.toString(),
                columnValues: {
                    client: {
                        text: client.clientId.toString(),
                        element: <Hyperlink onClick={() => {setRoute({page: 'client', clientId: client.clientId})}}>
                            {client.label} ({client.clientId.slice(0, 10)}...)
                        </Hyperlink>
                    },
                    ownerId: client.ownerId.toString()
                }
            }
        })
    ), [clients, setRoute])

    const handleDeleteClient = useCallback((clientId: string) => {
        if (!isNodeId(clientId)) return
        deleteClient(clientId)
    }, [deleteClient])

    const handleCreateClient = useCallback((label: string) => {
        createClient(label, {navigateToClientPage: true})
    }, [createClient])

    return (
        <div style={{maxWidth: 1000}}>
            <div className="PageHeading">Clients</div>
            <div className="PageBlurb">
                Clients are used to access kachery cloud resources on your behalf.
                &nbsp;Each client is associated with a user.
                &nbsp;If you are accessing these resources from your computer,
                &nbsp;you can register a client by installing the kachery-cloud Python package and running <span style={{fontFamily: 'courier'}}>kachery-cloud-init</span>.
            </div>
            <IconButton onClick={refreshClients} title="Refresh clients"><Refresh /></IconButton>
            <IconButton onClick={createClientVisible.show} title="Create client"><AddCircle /></IconButton>
            {
                createClientVisible.visible && (
                    <CreateClientControl
                        onCreate={handleCreateClient}
                        onClose={createClientVisible.hide}
                    />
                )
            }
            <NiceTable
                columns={columns}
                rows={rows}
                onDeleteRow={handleDeleteClient}
            />
            {
                !clients ? (
                    <div>Loading clients...</div>
                ) : <span />
            }
        </div>
    )
}

export default ClientsTable