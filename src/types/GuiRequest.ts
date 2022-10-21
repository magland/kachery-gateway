import { Auth, isAuth } from "./Auth"
import { Client, isClient } from "./Client"
import { isNodeId, isPrivateKeyHex, isSignature, NodeId, PrivateKeyHex, Signature } from "./keypair"
import { isLogItem, LogItem } from "./LogItem"
import validateObject, { isArrayOf, isEqualTo, isOneOf, isString, optional } from "./validateObject"

//////////////////////////////////////////////////////////////////////////////////
// getProjectsForUser

export type GetRecentActivityRequest = {
    type: 'getRecentActivity'
    auth: Auth
}

export const isGetRecentActivityRequest = (x: any): x is GetRecentActivityRequest => {
    return validateObject(x, {
        type: isEqualTo('getRecentActivity'),
        auth: isAuth
    })
}

export type GetRecentActivityResponse = {
    type: 'getRecentActivity'
    logItems: LogItem[]
}

export const isGetRecentActivityResponse = (x: any): x is GetRecentActivityResponse => {
    return validateObject(x, {
        type: isEqualTo('getRecentActivity'),
        logItems: isArrayOf(isLogItem)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// addClient

export type AddClientRequest = {
    type: 'addClient'
    clientId: NodeId
    label: string
    ownerId: string
    verificationDocument: {
        type: 'addClient'
    }
    verificationSignature: Signature
    privateKeyHex?: PrivateKeyHex
    auth: Auth
}

export const isAddClientRequest = (x: any): x is AddClientRequest => {
    return validateObject(x, {
        type: isEqualTo('addClient'),
        clientId: isNodeId,
        label: isString,
        ownerId: isString,
        verificationDocument: (a: any) => (
            validateObject(a, {
                type: isEqualTo('addClient')
            })
        ),
        verificationSignature: isSignature,
        privateKeyHex: optional(isPrivateKeyHex),
        auth: isAuth
    })
}

export type AddClientResponse = {
    type: 'addClient'
}

export const isAddClientResponse = (x: any): x is AddClientResponse => {
    return validateObject(x, {
        type: isEqualTo('addClient')
    })
}

//////////////////////////////////////////////////////////////////////////////////
// deleteClient

export type DeleteClientRequest = {
    type: 'deleteClient'
    clientId: NodeId
    ownerId: string
    auth: Auth
}

export const isDeleteClientRequest = (x: any): x is DeleteClientRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteClient'),
        clientId: isNodeId,
        ownerId: isString,
        auth: isAuth
    })
}

export type DeleteClientResponse = {
    type: 'deleteClient'
}

export const isDeleteClientResponse = (x: any): x is DeleteClientResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteClient')
    })
}

//////////////////////////////////////////////////////////////////////////////////
// getClients

export type GetClientsRequest = {
    type: 'getClients'
    userId?: string
    auth: Auth
}

export const isGetClientsRequest = (x: any): x is GetClientsRequest => {
    return validateObject(x, {
        type: isEqualTo('getClients'),
        userId: optional(isString),
        auth: isAuth
    })
}

export type GetClientsResponse = {
    type: 'getClients'
    clients: Client[]
}

export const isGetClientsResponse = (x: any): x is GetClientsResponse => {
    return validateObject(x, {
        type: isEqualTo('getClients'),
        clients: isArrayOf(isClient)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// setClientInfo

export type SetClientInfoRequest = {
    type: 'setClientInfo'
    clientId: NodeId
    label?: string
    auth: Auth
}

export const isSetClientInfoRequest = (x: any): x is SetClientInfoRequest => {
    return validateObject(x, {
        type: isEqualTo('setClientInfo'),
        clientId: isNodeId,
        label: optional(isString),
        auth: isAuth
    })
}

export type SetClientInfoResponse = {
    type: 'setClientInfo'
}

export const isSetClientInfoResponse = (x: any): x is SetClientInfoResponse => {
    return validateObject(x, {
        type: isEqualTo('setClientInfo')
    })
}


//////////////////////////////////////////////////////////////////////////////////

export type GuiRequest =
    GetRecentActivityRequest |
    AddClientRequest |
    DeleteClientRequest |
    GetClientsRequest |
    SetClientInfoRequest

export const isGuiRequest = (x: any): x is GuiRequest => {
    return isOneOf([
        isGetRecentActivityRequest,
        isAddClientRequest,
        isDeleteClientRequest,
        isGetClientsRequest,
        isSetClientInfoRequest
    ])(x)
}

export type GuiResponse =
    GetRecentActivityResponse |
    AddClientResponse |
    DeleteClientResponse |
    GetClientsResponse |
    SetClientInfoResponse

export const isGuiResponse = (x: any): x is GuiResponse => {
    return isOneOf([
        isGetRecentActivityResponse,
        isAddClientResponse,
        isDeleteClientResponse,
        isGetClientsResponse,
        isSetClientInfoResponse
    ])(x)
}