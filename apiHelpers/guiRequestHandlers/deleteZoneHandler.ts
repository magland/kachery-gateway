import { DeleteZoneRequest, DeleteZoneResponse } from "../../src/types/GuiRequest";
import { getUser } from "../common/getDatabaseItems";
import { ZoneData, getZoneData, invalidateZoneInfoInCache, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { deleteObject, getObjectContent, objectExists, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteZoneHandler = async (request: DeleteZoneRequest, verifiedUserId?: string): Promise<DeleteZoneResponse> => {
    const { zone } = request

    const defaultZoneData = await getZoneData('default')
    const defaultBucket = defaultZoneData.bucket

    const zoneKey = `registered-zones/${zone}`
    if (!(await objectExists(defaultBucket, zoneKey))) {
        throw Error(`Zone not found: ${zone}`)
    }
    const zoneInfo: ZoneData = JSON.parse(await getObjectContent(defaultBucket, zoneKey))

    if (zoneInfo.ownerId !== verifiedUserId) {
        throw Error('Not authorized to delete zone. Owner ID does not match.')
    }

    const user = await getUser('default', zoneInfo.ownerId)
    if (!user) throw Error(`User not found in zone 'default'}: ${zoneInfo.ownerId}`)
    user['zones'] = user['zones'].filter((zn: string) => (zn !== zone))

    const {bucketName: defaultBucketName} = parseBucketUri(defaultBucket.uri)
    const registeredZoneKey = joinKeys(zoneInfo.directory, `registered-zones/${zone}`)
    const userKey = joinKeys(zoneInfo.directory, `users/${zoneInfo.ownerId}`)
    await putObject(defaultBucket, {
        Bucket: defaultBucketName,
        Key: userKey,
        Body: JSON.stringify(user, null, 4)
    })
    await deleteObject(defaultBucket, registeredZoneKey)

    invalidateZoneInfoInCache(zone)

    return {
        type: 'deleteZone'
    }
}

export default deleteZoneHandler