import { SetResourceInfoRequest, SetResourceInfoResponse } from "../../src/types/GuiRequest";
import { getResource, invalidateResourceInCache } from "../common/getDatabaseItems";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const setResourceInfoHandler = async (request: SetResourceInfoRequest, verifiedUserId?: string): Promise<SetResourceInfoResponse> => {
    const { resourceName, proxyUrl, zone } = request

    const resource = await getResource(zone || 'default', resourceName.toString())

    if (resource.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set resource info')
    }
    
    if (proxyUrl !== undefined) {
        resource.proxyUrl = proxyUrl
    }

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneData.directory, `resources/${resourceName}`)
    await putObject(bucket, {
        Key: key,
        Bucket: bucketName,
        Body: JSON.stringify(resource, null, 4)
    })

    invalidateResourceInCache(zone || 'default', resourceName.toString())

    return {
        type: 'setResourceInfo'
    }
}

export default setResourceInfoHandler