import { Client, isClient } from "./Client"
import { isNodeId, isSignature, NodeId, Signature } from "./keypair"
import validateObject, { isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

//////////////////////////////////////////////////////////////////////////////////
// findFile

export type FindFileRequest = {
    payload: {
        type: 'findFile'
        timestamp: number
        hashAlg: 'sha1'
        hash: string
    }
    fromClientId: NodeId
    signature: Signature
}

export const isFindFileRequest = (x: any): x is FindFileRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('findFile'),
            timestamp: isNumber,
            hashAlg: isOneOf([isEqualTo('sha1')]),
            hash: isString
        })
    }
    return validateObject(x, {
        payload: isPayload,
        fromClientId: optional(isNodeId),
        signature: optional(isSignature)
    })
}

export type FindFileResponse = {
    type: 'findFile'
    found: boolean
    size?: number
    url?: string
    bucketUri?: string
    objectKey?: string
    cacheHit?: boolean
}

export const isFindFileResponse = (x: any): x is FindFileResponse => {
    return validateObject(x, {
        type: isEqualTo('findFile'),
        found: isBoolean,
        size: optional(isNumber),
        url: optional(isString),
        bucketUri: optional(isString),
        objectKey: optional(isString),
        cacheHit: optional(isBoolean)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// initiateFileUpload

export type InitiateFileUploadRequest = {
    payload: {
        type: 'initiateFileUpload'
        timestamp: number
        size: number
        hashAlg: 'sha1'
        hash: string
    }
    fromClientId: NodeId
    signature: Signature
}

export const isInitiateFileUploadRequest = (x: any): x is InitiateFileUploadRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('initiateFileUpload'),
            timestamp: isNumber,
            size: isNumber,
            hashAlg: isOneOf([isEqualTo('sha1')]),
            hash: isString
        })
    }
    return validateObject(x, {
        payload: isPayload,
        fromClientId: isNodeId,
        signature: isSignature
    })
}

export type InitiateFileUploadResponse = {
    type: 'initiateFileUpload'
    alreadyExists?: boolean
    objectKey?: string
    signedUploadUrl?: string
    alreadyPending?: boolean
}

export const isInitiateFileUploadResponse = (x: any): x is InitiateFileUploadResponse => {
    return validateObject(x, {
        type: isEqualTo('initiateFileUpload'),
        alreadyExists: optional(isBoolean),
        objectKey: optional(isString),
        signedUploadUrl: optional(isString),
        alreadyPending: optional(isBoolean)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// finalizeFileUpload

export type FinalizeFileUploadRequest = {
    payload: {
        type: 'finalizeFileUpload'
        timestamp: number
        objectKey: string
        hashAlg: 'sha1'
        hash: string
        size: number
    }
    fromClientId: NodeId
    signature: Signature
}

export const isFinalizeFileUploadRequest = (x: any): x is FinalizeFileUploadRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('finalizeFileUpload'),
            timestamp: isNumber,
            objectKey: isString,
            hashAlg: isOneOf([isEqualTo('sha1')]),
            hash: isString,
            size: isNumber
        })
    }
    return validateObject(x, {
        payload: isPayload,
        fromClientId: isNodeId,
        signature: isSignature
    })
}

export type FinalizeFileUploadResponse = {
    type: 'finalizeFileUpload'
}

export const isFinalizeFileUploadResponse = (x: any): x is FinalizeFileUploadResponse => {
    return validateObject(x, {
        type: isEqualTo('finalizeFileUpload')
    })
}

//////////////////////////////////////////////////////////////////////////////////
// getClientInfo

export type GetClientInfoRequest = {
    payload: {
        type: 'getClientInfo'
        timestamp: number
        clientId: NodeId
    }
    fromClientId: NodeId
    signature: Signature
}

export const isGetClientInfoRequest = (x: any): x is GetClientInfoRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('getClientInfo'),
            timestamp: isNumber,
            clientId: isNodeId
        })
    }
    return validateObject(x, {
        payload: isPayload,
        fromClientId: isNodeId,
        signature: isSignature
    })
}

export type GetClientInfoResponse = {
    type: 'getClientInfo'
    found: boolean
    client?: Client
}

export const isGetClientInfoResponse = (x: any): x is GetClientInfoResponse => {
    return validateObject(x, {
        type: isEqualTo('getClientInfo'),
        found: isBoolean,
        client: optional(isClient)
    })
}

//////////////////////////////////////////////////////////////////////////////////
// getZoneInfo

export type GetZoneInfoRequest = {
    payload: {
        type: 'getZoneInfo'
        timestamp: number
        zoneName: string
    }
    fromClientId: NodeId
    signature: Signature
}

export const isGetZoneInfoRequest = (x: any): x is GetZoneInfoRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('getZoneInfo'),
            timestamp: isNumber,
            zoneName: isString
        })
    }
    return validateObject(x, {
        payload: isPayload,
        fromClientId: isNodeId,
        signature: isSignature
    })
}

export type GetZoneInfoResponse = {
    type: 'getZoneInfo'
    found: boolean
    kacheryGatewayUrl?: string
}

export const isGetZoneInfoResponse = (x: any): x is GetZoneInfoResponse => {
    return validateObject(x, {
        type: isEqualTo('getZoneInfo'),
        found: isBoolean,
        kacheryGatewayUrl: optional(isString)
    })
}


//////////////////////////////////////////////////////////////////////////////////

export type GatewayRequest =
    FindFileRequest |
    InitiateFileUploadRequest |
    FinalizeFileUploadRequest |
    GetClientInfoRequest |
    GetZoneInfoRequest

export const isGatewayRequest = (x: any): x is GatewayRequest => {
    return isOneOf([
        isFindFileRequest,
        isInitiateFileUploadRequest,
        isFinalizeFileUploadRequest,
        isGetClientInfoRequest,
        isGetZoneInfoRequest
    ])(x)
}

export type GatewayResponse =
    FindFileResponse |
    InitiateFileUploadResponse |
    FinalizeFileUploadResponse |
    GetClientInfoResponse |
    GetZoneInfoResponse

export const isGatewayResponse = (x: any): x is GatewayResponse => {
    return isOneOf([
        isFindFileResponse,
        isInitiateFileUploadResponse,
        isFinalizeFileUploadResponse,
        isGetClientInfoResponse,
        isGetZoneInfoResponse
    ])(x)
}