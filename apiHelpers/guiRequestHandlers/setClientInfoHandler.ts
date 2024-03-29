import { SetClientInfoRequest, SetClientInfoResponse } from "../../src/types/GuiRequest";
import { getClient, invalidateClientInCache } from "../common/getDatabaseItems";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const setClientInfoHandler = async (request: SetClientInfoRequest, verifiedUserId?: string): Promise<SetClientInfoResponse> => {
    const { clientId, label, zone } = request

    const client = await getClient(zone || 'default', clientId.toString())

    if (client.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set client info')
    }
    
    if (label !== undefined) {
        client.label = label
    }

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)
    const key = joinKeys(zoneData.directory, `clients/${clientId}`)
    await putObject(bucket, {
        Key: key,
        Bucket: bucketName,
        Body: JSON.stringify(client, null, 4)
    })

    // await collection.doc(clientId.toString()).set(client)

    // const adminBucket = getAdminBucket()
    // const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)
    // const kk = `clients/${clientId}`

    // await putObject(adminBucket, {
    //     Key: kk,
    //     Body: JSONStringifyDeterministic(client),
    //     Bucket: adminBucketName
    // })

    invalidateClientInCache(zone || 'default', clientId.toString())
    // invalidateAllClients()

    return {
        type: 'setClientInfo'
    }
}

export default setClientInfoHandler