import { SetZoneInfoRequest, SetZoneInfoResponse } from "../../src/types/GuiRequest";
import { getZoneData, getZoneInfo, invalidateZoneInfoInCache, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const setZoneInfoHandler = async (request: SetZoneInfoRequest, verifiedUserId?: string): Promise<SetZoneInfoResponse> => {
    const { zone, bucketName, directory } = request

    const zoneInfo = await getZoneInfo(zone)

    if (zoneInfo.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set resource info')
    }

    let somethingChanged = false

    if (bucketName !== undefined) {
        somethingChanged = true
        zoneInfo.bucketName = bucketName
    }

    if (directory !== undefined) {
        somethingChanged = true
        zoneInfo.directory = directory
    }

    if (!somethingChanged) {
        return {
            type: 'setZoneInfo'
        }
    }

    const defaultZoneData = await getZoneData('default')
    const defaultBucket = defaultZoneData.bucket
    const {bucketName: defaultBucketName} = parseBucketUri(defaultBucket.uri)
    const key = joinKeys(defaultZoneData.directory, `registered-zones/${zone}`)
    await putObject(defaultBucket, {
        Key: key,
        Bucket: defaultBucketName,
        Body: JSON.stringify(zoneInfo, null, 4)
    })

    invalidateZoneInfoInCache(zone)

    return {
        type: 'setZoneInfo'
    }
}

export default setZoneInfoHandler