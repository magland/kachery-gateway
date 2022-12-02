import { Auth, isAuth } from "./Auth"
import { Client, isClient } from "./Client"
import { isNodeId, isPrivateKeyHex, isSignature, NodeId, PrivateKeyHex, Signature } from "./keypair"
import { isResource, Resource } from "./Resource"
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
    userId: string
    auth: Auth
}

export const isGetClientsRequest = (x: any): x is GetClientsRequest => {
    return validateObject(x, {
        type: isEqualTo('getClients'),
        userId: isString,
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
// addResource

export type AddResourceRequest = {
    type: 'addResource'
    resourceName: string
    proxyUrl: string
    ownerId: string
    auth: Auth
}

export const isAddResourceRequest = (x: any): x is AddResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('addResource'),
        resourceName: isString,
        proxyUrl: isString,
        ownerId: isString,
        auth: isAuth
    })
}

export type AddResourceResponse = {
    type: 'addResource'
}

export const isAddResourceResponse = (x: any): x is AddResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('addResource')
    })
}

//////////////////////////////////////////////////////////////////////////////////
// deleteResource

export type DeleteResourceRequest = {
    type: 'deleteResource'
    resourceName: string
    ownerId: string
    auth: Auth
}

export const isDeleteResourceRequest = (x: any): x is DeleteResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteResource'),
        resourceName: isString,
        ownerId: isString,
        auth: isAuth
    })
}

export type DeleteResourceResponse = {
    type: 'deleteResource'
}

export const isDeleteResourceResponse = (x: any): x is DeleteResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteResource')
    })
}

//////////////////////////////////////////////////////////////////////////////////
// getResources

export type GetResourcesRequest = {
    type: 'getResources'
    userId: string
    auth: Auth
}

export const isGetResourcesRequest = (x: any): x is GetResourcesRequest => {
    return validateObject(x, {
        type: isEqualTo('getResources'),
        userId: isString,
        auth: isAuth
    })
}

export type GetResourcesResponse = {
    type: 'getResources'
    resources: Resource[]
}

export const isGetResourcesResponse = (x: any): x is GetResourcesResponse => {
    return validateObject(x, {
        type: isEqualTo('getResources'),
        resources: isArrayOf(isResource)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// setResourceInfo

export type SetResourceInfoRequest = {
    type: 'setResourceInfo'
    resourceName: string
    proxyUrl?: string
    auth: Auth
}

export const isSetResourceInfoRequest = (x: any): x is SetResourceInfoRequest => {
    return validateObject(x, {
        type: isEqualTo('setResourceInfo'),
        resourceName: isString,
        proxyUrl: optional(isString),
        auth: isAuth
    })
}

export type SetResourceInfoResponse = {
    type: 'setResourceInfo'
}

export const isSetResourceInfoResponse = (x: any): x is SetResourceInfoResponse => {
    return validateObject(x, {
        type: isEqualTo('setResourceInfo')
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

type HeaderInfo = {userAgent: string, ip: string, ipCity: string, ipCountry: string, ipCountryRegion: string, referer: string}

export type UsageRequestUsage = {
    timestamp: number,
    clients: {[key: string]: {clientId: string, ownerId: string, headerInfo: HeaderInfo | undefined}}
    dailyUsage: {
        date: string
        clientUsage: {[key: string]: {uploadCount: number, uploadSize: number, downloadCount: number, downloadSize: number, fallbackDownloadCount: number, fallbackDownloadSize: number, ownerId: string}}
    }[]
    totalUsage: {
        clientUsage: {[key: string]: {uploadCount: number, uploadSize: number, downloadCount: number, downloadSize: number, fallbackDownloadCount: number, fallbackDownloadSize: number, ownerId: string}}
    }
}

export const isUsageRequestUsage = (x: any): x is UsageRequestUsage => {
    return validateObject(x, {
        timestamp: isNumber,
        clients: () => (true),
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
    AddResourceRequest |
    DeleteResourceRequest |
    GetResourcesRequest |
    SetResourceInfoRequest |
    GetUsageRequest

export const isGuiRequest = (x: any): x is GuiRequest => {
    return isOneOf([
        isAddClientRequest,
        isDeleteClientRequest,
        isGetClientsRequest,
        isSetClientInfoRequest,
        isAddResourceRequest,
        isDeleteResourceRequest,
        isGetResourcesRequest,
        isSetResourceInfoRequest,
        isGetUsageRequest
    ])(x)
}

export type GuiResponse =
    AddClientResponse |
    DeleteClientResponse |
    GetClientsResponse |
    SetClientInfoResponse |
    AddResourceResponse |
    DeleteResourceResponse |
    GetResourcesResponse |
    SetResourceInfoResponse |
    GetUsageResponse

export const isGuiResponse = (x: any): x is GuiResponse => {
    return isOneOf([
        isAddClientResponse,
        isDeleteClientResponse,
        isGetClientsResponse,
        isSetClientInfoResponse,
        isAddResourceResponse,
        isDeleteResourceResponse,
        isGetResourcesResponse,
        isSetResourceInfoResponse,
        isGetUsageResponse
    ])(x)
}