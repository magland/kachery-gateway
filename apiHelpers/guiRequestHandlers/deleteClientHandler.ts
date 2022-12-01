import { DeleteClientRequest, DeleteClientResponse } from "../../src/types/GuiRequest";
import { getClient, getUser, invalidateClientInCache } from "../common/getDatabaseItems";
import { getBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler";
import { deleteObject, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteClientHandler = async (request: DeleteClientRequest, verifiedUserId?: string): Promise<DeleteClientResponse> => {
    const { clientId, ownerId } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const client = await getClient(clientId.toString())
    if (client.ownerId !== ownerId) {
        throw Error('Not authorized to delete client. Owner ID does not match.')
    }
    const user = await getUser(ownerId)
    user['clientIds'] = user['clientIds'].filter(id => (id !== clientId))

    const bucket = getBucket()
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = `clients/${clientId}`
    const userKey = `users/${ownerId}`
    await putObject(bucket, {
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(user, null, 4)
    })
    await deleteObject(bucket, key)

    invalidateClientInCache(clientId.toString())
    // invalidateAllClients()

    return {
        type: 'deleteClient'
    }
}

export default deleteClientHandler