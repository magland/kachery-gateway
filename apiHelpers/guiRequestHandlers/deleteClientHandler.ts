import { DeleteClientRequest, DeleteClientResponse } from "../../src/types/GuiRequest";
import { getClient, getUser, invalidateClientInCache } from "../common/getDatabaseItems";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { deleteObject, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteClientHandler = async (request: DeleteClientRequest, verifiedUserId?: string): Promise<DeleteClientResponse> => {
    const { clientId, ownerId, zone } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const client = await getClient(zone || 'default', clientId.toString())
    if (client.ownerId !== ownerId) {
        throw Error('Not authorized to delete client. Owner ID does not match.')
    }
    const user = await getUser(zone || 'default', ownerId)
    if (!user) throw Error(`User not found in zone ${zone || 'default'}: ${ownerId}`)
    user['clientIds'] = user['clientIds'].filter((id: string) => (id !== clientId.toString()))

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneData.directory, `clients/${clientId}`)
    const userKey = joinKeys(zoneData.directory, `users/${ownerId}`)
    await putObject(bucket, {
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(user, null, 4)
    })
    await deleteObject(bucket, key)

    invalidateClientInCache(zone || 'default', clientId.toString())
    // invalidateAllClients()

    return {
        type: 'deleteClient'
    }
}

export default deleteClientHandler