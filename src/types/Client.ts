import { isNodeId, isPrivateKeyHex, NodeId, PrivateKeyHex } from "./keypair"
import validateObject, { isNumber, isString, optional } from "./validateObject"

export type Client = {
    clientId: NodeId
    ownerId: string
    timestampCreated: number
    label: string
    privateKeyHex?: PrivateKeyHex
}

export const isClient = (x: any): x is Client => {
    return validateObject(x, {
        clientId: isNodeId,
        ownerId: isString,
        timestampCreated: isNumber,
        label: isString,
        privateKeyHex: optional(isPrivateKeyHex)
    })
}