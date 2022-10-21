import { isNodeId, isNumber, isPrivateKeyHex, isString, isUserId, NodeId, optional, PrivateKeyHex, UserId, _validateObject } from "../commonInterface/kacheryTypes"

export type Client = {
    clientId: NodeId
    ownerId: UserId
    timestampCreated: number
    label: string
    privateKeyHex?: PrivateKeyHex
}

export const isClient = (x: any): x is Client => {
    return _validateObject(x, {
        clientId: isNodeId,
        ownerId: isUserId,
        timestampCreated: isNumber,
        label: isString,
        privateKeyHex: optional(isPrivateKeyHex)
    })
}