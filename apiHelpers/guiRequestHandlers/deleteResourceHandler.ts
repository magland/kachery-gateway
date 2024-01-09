import { DeleteResourceRequest, DeleteResourceResponse } from "../../src/types/GuiRequest";
import { getResource, getUser, invalidateResourceInCache } from "../common/getDatabaseItems";
import { getZoneInfo, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { deleteObject, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteResourceHandler = async (request: DeleteResourceRequest, verifiedUserId?: string): Promise<DeleteResourceResponse> => {
    const { resourceName, ownerId, zone } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const resource = await getResource(zone || 'default', resourceName.toString())
    if (resource.ownerId !== ownerId) {
        throw Error('Not authorized to delete resource. Owner ID does not match.')
    }
    const user = await getUser(zone || 'default', ownerId)
    if (!user) throw Error(`User not found in zone ${zone || 'default'}: ${ownerId}`)
    user['resourceNames'] = user['resourceNames'].filter(id => (id !== resourceName))

    const zoneInfo = await getZoneInfo(zone || 'default')

    const bucket = zoneInfo.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneInfo.directory, `resources/${resourceName}`)
    const userKey = joinKeys(zoneInfo.directory, `users/${ownerId}`)
    await putObject(bucket, {
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(user, null, 4)
    })
    await deleteObject(bucket, key)

    invalidateResourceInCache(zone || 'default', resourceName.toString())

    return {
        type: 'deleteResource'
    }
}

export default deleteResourceHandler