import { isNodeId, isSignature, NodeId, Signature } from "./keypair"
import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

//////////////////////////////////////////////////////////////////////////////////
// findFile

export type FindFileRequest = {
    payload: {
        type: 'findFile'
        timestamp: number
        hashAlg: string
        hash: string
        bucketHints?: string[]
    }
    fromClientId: NodeId
    signature: Signature
}

export const isFindFileRequest = (x: any): x is FindFileRequest => {
    const isPayload = (y: any) => {
        return validateObject(y, {
            type: isEqualTo('findFile'),
            timestamp: isNumber,
            hashAlg: isString,
            hash: isString,
            bucketHints: optional(isArrayOf(isString))
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
    cacheHit?: boolean
}

export const isFindFileResponse = (x: any): x is FindFileResponse => {
    return validateObject(x, {
        type: isEqualTo('findFile'),
        found: isBoolean,
        size: optional(isNumber),
        url: optional(isString),
        bucketUri: optional(isString),
        cacheHit: optional(isBoolean)
    })
}


//////////////////////////////////////////////////////////////////////////////////

export type GatewayRequest =
    FindFileRequest

export const isGatewayRequest = (x: any): x is GatewayRequest => {
    return isOneOf([
        isFindFileRequest
    ])(x)
}

export type GatewayResponse =
    FindFileResponse

export const isGatewayResponse = (x: any): x is GatewayResponse => {
    return isOneOf([
        isFindFileResponse
    ])(x)
}