import { hexToPublicKey, verifySignature } from "../../src/crypto/signatures";
import { Client } from "../../src/types/Client";
import { AddClientRequest, AddClientResponse } from "../../src/types/GuiRequest";
import { nodeIdToPublicKeyHex } from "../../src/types/keypair";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { getObjectContent, objectExists, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

// const MAX_NUM_CLIENTS_PER_USER = 25

const addClientHandler = async (request: AddClientRequest, verifiedUserId?: string): Promise<AddClientResponse> => {
    const { clientId, ownerId, label, privateKeyHex, zone } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    // we need to verify that the user owns the client
    // const elapsed = Date.now() - request.verificationDocument.timestamp
    // if ((elapsed < -3000) || (elapsed > 60 * 1000)) {
    //     throw Error('Invalid timestamp when verifying control of client')
    // }
    if (!verifySignature(request.verificationDocument, hexToPublicKey(nodeIdToPublicKeyHex(request.clientId)), request.verificationSignature)) {
        throw Error('Invalid verification signature')
    }

    const client: Client = {
        clientId,
        ownerId,
        timestampCreated: Date.now(),
        label
    }
    if (privateKeyHex) client.privateKeyHex = privateKeyHex
    
    // await putObject(adminBucket, {
    //     Key: kk,
    //     Body: JSONStringifyDeterministic(client),
    //     Bucket: adminBucketName
    // })

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneData.directory, `clients/${clientId}`)
    const exists = await objectExists(bucket, key)
    if (exists) {
        throw Error('Client already exists.')
    }
    await putObject(bucket, {
        Key: key,
        Bucket: bucketName,
        Body: JSON.stringify(client, null, 4)
    })
    const userKey = joinKeys(zoneData.directory, `users/${ownerId}`)
    let user: {[key: string]: any} = {}
    if (await objectExists(bucket, userKey)) {
        user = JSON.parse(await getObjectContent(bucket, userKey))
    }
    user['clientIds'] = [...(user['clientIds'] || []), client.clientId]
    await putObject(bucket, {
        Key: userKey,
        Body: JSON.stringify(user, null, 4),
        Bucket: bucketName
    })

    // await clientsCollection.doc(clientId.toString()).set(client)

    // invalidateAllClients()
    
    return {
        type: 'addClient'
    }
}

export default addClientHandler