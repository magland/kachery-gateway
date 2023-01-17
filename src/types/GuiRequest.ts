import { Auth, isAuth } from "./Auth"
import { Client, isClient } from "./Client"
import { isNodeId, isPrivateKeyHex, isSignature, NodeId, PrivateKeyHex, Signature } from "./keypair"
import { isResource, Resource } from "./Resource"
import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

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
    zone?: string
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
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isDeleteClientRequest = (x: any): x is DeleteClientRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteClient'),
        clientId: isNodeId,
        ownerId: isString,
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isGetClientsRequest = (x: any): x is GetClientsRequest => {
    return validateObject(x, {
        type: isEqualTo('getClients'),
        userId: isString,
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isSetClientInfoRequest = (x: any): x is SetClientInfoRequest => {
    return validateObject(x, {
        type: isEqualTo('setClientInfo'),
        clientId: isNodeId,
        label: optional(isString),
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isAddResourceRequest = (x: any): x is AddResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('addResource'),
        resourceName: isString,
        proxyUrl: isString,
        ownerId: isString,
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isDeleteResourceRequest = (x: any): x is DeleteResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteResource'),
        resourceName: isString,
        ownerId: isString,
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isGetResourcesRequest = (x: any): x is GetResourcesRequest => {
    return validateObject(x, {
        type: isEqualTo('getResources'),
        userId: isString,
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isSetResourceInfoRequest = (x: any): x is SetResourceInfoRequest => {
    return validateObject(x, {
        type: isEqualTo('setResourceInfo'),
        resourceName: isString,
        proxyUrl: optional(isString),
        zone: optional(isString),
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
    zone?: string
    auth: Auth
}

export const isGetUsageRequest = (x: any): x is GetUsageRequest => {
    return validateObject(x, {
        type: isEqualTo('getUsage'),
        zone: optional(isString),
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
// getAdminConfiguration

export type GetAdminConfigurationRequest = {
    type: 'getAdminConfiguration'
    zone?: string
    auth: Auth
}

export const isGetAdminConfigurationRequest = (x: any): x is GetAdminConfigurationRequest => {
    return validateObject(x, {
        type: isEqualTo('getAdminConfiguration'),
        zone: optional(isString),
        auth: isAuth
    })
}

export type AdminConfiguration = {
    mongoUri?: string
    githubClientId?: string,
    githubClientSecret?: string,
    adminUsers?: string,
    zoneDirectory?: string,
    reCaptchaKey?: string,
    reCaptchaSecretKey?: string
}

export const isAdminConfiguration = (x: any): x is AdminConfiguration => {
    return validateObject(x, {
        bucketUri: optional(isString),
        bucketCredentials: optional(isString),
        fallbackBucketUri: optional(isString),
        fallbackBucketCredentials: optional(isString),
        mongoUri: optional(isString),
        githubClientId: optional(isString),
        githubClientSecret: optional(isString),
        adminUsers: optional(isString),
        kacheryZones: optional(isString),
        reCaptchaKey: optional(isString),
        reCaptchaSecretKey: optional(isString)
    })
}

export type GetAdminConfigurationResponse = {
    type: 'getAdminConfiguration'
    adminConfiguration: AdminConfiguration
}

export const isGetAdminConfigurationResponse = (x: any): x is GetAdminConfigurationResponse => {
    return validateObject(x, {
        type: isEqualTo('getAdminConfiguration'),
        adminConfiguration: isAdminConfiguration
    })
}

//////////////////////////////////////////////////////////////////////////////////
// testConfiguration

export type TestConfigurationRequest = {
    type: 'testConfiguration'
    testType: string
    zone?: string
    auth: Auth
}

export const isTestConfigurationRequest = (x: any): x is TestConfigurationRequest => {
    return validateObject(x, {
        type: isEqualTo('testConfiguration'),
        testType: isString,
        zone: optional(isString),
        auth: isAuth
    })
}

export type TestConfigurationResponse = {
    type: 'testConfiguration'
    passed: boolean
    result: any
}

export const isTestConfigurationResponse = (x: any): x is TestConfigurationResponse => {
    return validateObject(x, {
        type: isEqualTo('testConfiguration'),
        passed: isBoolean,
        result: () => (true)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// adminAction

export type AdminActionRequest = {
    type: 'adminAction'
    actionType: string
    parameters?: string
    zone?: string
    auth: Auth
}

export const isAdminActionRequest = (x: any): x is AdminActionRequest => {
    return validateObject(x, {
        type: isEqualTo('adminAction'),
        actionType: isString,
        parameters: optional(() => (true)),
        zone: optional(isString),
        auth: isAuth
    })
}

export type AdminActionResponse = {
    type: 'adminAction'
    success: boolean
}

export const isAdminActionResponse = (x: any): x is AdminActionResponse => {
    return validateObject(x, {
        type: isEqualTo('adminAction'),
        success: isBoolean
    })
}

//////////////////////////////////////////////////////////////////////////////////
// getAuthorizationSettingsYaml

export type GetAuthorizationSettingsYamlRequest = {
    type: 'getAuthorizationSettingsYaml'
    zone?: string
    auth: Auth
}

export const isGetAuthorizationSettingsYamlRequest = (x: any): x is GetAuthorizationSettingsYamlRequest => {
    return validateObject(x, {
        type: isEqualTo('getAuthorizationSettingsYaml'),
        zone: optional(isString),
        auth: isAuth
    })
}

export type GetAuthorizationSettingsYamlResponse = {
    type: 'getAuthorizationSettingsYaml'
    authorizationSettingsYaml?: string
}

export const isGetAuthorizationSettingsYamlResponse = (x: any): x is GetAuthorizationSettingsYamlResponse => {
    return validateObject(x, {
        type: isEqualTo('getAuthorizationSettingsYaml'),
        authorizationSettingsYaml: optional(isString)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// setAuthorizationSettingsYaml

export type SetAuthorizationSettingsYamlRequest = {
    type: 'setAuthorizationSettingsYaml'
    authorizationSettingsYaml: string
    zone?: string
    auth: Auth
}

export const isSetAuthorizationSettingsYamlRequest = (x: any): x is SetAuthorizationSettingsYamlRequest => {
    return validateObject(x, {
        type: isEqualTo('setAuthorizationSettingsYaml'),
        authorizationSettingsYaml: isString,
        zone: optional(isString),
        auth: isAuth
    })
}

export type SetAuthorizationSettingsYamlResponse = {
    type: 'setAuthorizationSettingsYaml'
}

export const isSetAuthorizationSettingsYamlResponse = (x: any): x is SetAuthorizationSettingsYamlResponse => {
    return validateObject(x, {
        type: isEqualTo('setAuthorizationSettingsYaml')
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
    GetUsageRequest |
    GetAdminConfigurationRequest |
    TestConfigurationRequest |
    AdminActionRequest |
    GetAuthorizationSettingsYamlRequest |
    SetAuthorizationSettingsYamlRequest

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
        isGetUsageRequest,
        isGetAdminConfigurationRequest,
        isTestConfigurationRequest,
        isAdminActionRequest,
        isGetAuthorizationSettingsYamlRequest,
        isSetAuthorizationSettingsYamlRequest
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
    GetUsageResponse |
    GetAdminConfigurationResponse |
    TestConfigurationResponse |
    AdminActionResponse |
    GetAuthorizationSettingsYamlResponse |
    SetAuthorizationSettingsYamlResponse

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
        isGetUsageResponse,
        isGetAdminConfigurationResponse,
        isTestConfigurationResponse,
        isAdminActionResponse,
        isGetAuthorizationSettingsYamlResponse,
        isSetAuthorizationSettingsYamlResponse
    ])(x)
}