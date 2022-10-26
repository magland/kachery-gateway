import { Auth, isAuth } from "./Auth"
import { Client, isClient } from "./Client"
import { isNodeId, isPrivateKeyHex, isSignature, NodeId, PrivateKeyHex, Signature } from "./keypair"
import validateObject, { isArrayOf, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

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
// getUsage

export type GetUsageRequest = {
    type: 'getUsage'
    auth: Auth
}

export const isGetUsageRequest = (x: any): x is GetUsageRequest => {
    return validateObject(x, {
        type: isEqualTo('getUsage'),
        auth: isAuth
    })
}

export type UsageRequestUsage = {
    timestamp: number,
    dailyUsage: {
        date: string
        clientUsage: {[key: string]: {count: number, size: number, ownerId: string}}
    }[]
    totalUsage: {
        clientUsage: {[key: string]: {count: number, size: number, ownerId: string}}
    }
}

export const isUsageRequestUsage = (x: any): x is UsageRequestUsage => {
    return validateObject(x, {
        timestamp: isNumber,
        dailyUsage: () => (true),
        totalUsage: () => (true)
    })
}

export type GetUsageResponse = {
    type: 'getUsage'
    usage: UsageRequestUsage
}

export const isGetUsageResponse = (x: any): x is GetUsageResponse => {
    return validateObject(x, {
        type: isEqualTo('getUsage'),
        usage: isUsageRequestUsage
    })
}

//////////////////////////////////////////////////////////////////////////////////

export type GuiRequest =
    AddClientRequest |
    DeleteClientRequest |
    GetClientsRequest |
    SetClientInfoRequest |
    GetUsageRequest

export const isGuiRequest = (x: any): x is GuiRequest => {
    return isOneOf([
        isAddClientRequest,
        isDeleteClientRequest,
        isGetClientsRequest,
        isSetClientInfoRequest,
        isGetUsageRequest
    ])(x)
}

export type GuiResponse =
    AddClientResponse |
    DeleteClientResponse |
    GetClientsResponse |
    SetClientInfoResponse |
    GetUsageResponse

export const isGuiResponse = (x: any): x is GuiResponse => {
    return isOneOf([
        isAddClientResponse,
        isDeleteClientResponse,
        isGetClientsResponse,
        isSetClientInfoResponse,
        isGetUsageResponse
    ])(x)
}