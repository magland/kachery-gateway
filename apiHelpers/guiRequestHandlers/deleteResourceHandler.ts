import { DeleteResourceRequest, DeleteResourceResponse } from "../../src/types/GuiRequest";
import { getResource, getUser, invalidateResourceInCache } from "../common/getDatabaseItems";
import { getBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler";
import { deleteObject, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteResourceHandler = async (request: DeleteResourceRequest, verifiedUserId?: string): Promise<DeleteResourceResponse> => {
    const { resourceName, ownerId } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const resource = await getResource(resourceName.toString())
    if (resource.ownerId !== ownerId) {
        throw Error('Not authorized to delete resource. Owner ID does not match.')
    }
    const user = await getUser(ownerId)
    user['resourceNames'] = user['resourceNames'].filter(id => (id !== resourceName))

    const bucket = getBucket()
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = `resources/${resourceName}`
    const userKey = `users/${ownerId}`
    await putObject(bucket, {
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(user, null, 4)
    })
    await deleteObject(bucket, key)

    invalidateResourceInCache(resourceName.toString())

    return {
        type: 'deleteResource'
    }
}

export default deleteResourceHandler