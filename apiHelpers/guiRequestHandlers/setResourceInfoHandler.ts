import { SetResourceInfoRequest, SetResourceInfoResponse } from "../../src/types/GuiRequest";
import { getResource, invalidateResourceInCache } from "../common/getDatabaseItems";
import { getBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler";
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const setResourceInfoHandler = async (request: SetResourceInfoRequest, verifiedUserId?: string): Promise<SetResourceInfoResponse> => {
    const { resourceName, proxyUrl } = request

    const resource = await getResource(resourceName.toString())

    if (resource.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set resource info')
    }
    
    if (proxyUrl !== undefined) {
        resource.proxyUrl = proxyUrl
    }

    const bucket = getBucket()
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = `resources/${resourceName}`
    await putObject(bucket, {
        Key: key,
        Bucket: bucketName,
        Body: JSON.stringify(resource, null, 4)
    })

    invalidateResourceInCache(resourceName.toString())

    return {
        type: 'setResourceInfo'
    }
}

export default setResourceInfoHandler