import { AddResourceRequest, AddResourceResponse } from "../../src/types/GuiRequest";
import { Resource } from "../../src/types/Resource";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { getObjectContent, objectExists, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

// const MAX_NUM_RESOURCES_PER_USER = 25

const addResourceHandler = async (request: AddResourceRequest, verifiedUserId?: string): Promise<AddResourceResponse> => {
    const { resourceName, ownerId, proxyUrl, zone } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const resource: Resource = {
        resourceName,
        ownerId,
        timestampCreated: Date.now(),
        proxyUrl
    }

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneData.directory, `resources/${resourceName}`)
    const exists = await objectExists(bucket, key)
    if (exists) {
        throw Error('Resource already exists.')
    }
    await putObject(bucket, {
        Key: key,
        Bucket: bucketName,
        Body: JSON.stringify(resource, null, 4)
    })
    const userKey = joinKeys(zoneData.directory, `users/${ownerId}`)
    let user: {[key: string]: any} = {}
    if (await objectExists(bucket, userKey)) {
        user = JSON.parse(await getObjectContent(bucket, userKey))
    }
    user['resourceNames'] = [...(user['resourceNames'] || []), resource.resourceName]
    await putObject(bucket, {
        Key: userKey,
        Body: JSON.stringify(user, null, 4),
        Bucket: bucketName
    })
    
    return {
        type: 'addResource'
    }
}

export default addResourceHandler