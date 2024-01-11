import { GetZonesRequest, GetZonesResponse } from "../../src/types/GuiRequest";
import { getUser } from "../common/getDatabaseItems";
import { isZoneInfo } from "../gatewayRequestHandlers/ZoneInfo";
import { getZoneData } from "../gatewayRequestHandlers/getZoneInfo";
import { deleteObject, getObjectContent, objectExists } from "../gatewayRequestHandlers/s3Helpers";

const getZonesHandler = async (request: GetZonesRequest, verifiedUserId?: string): Promise<GetZonesResponse> => {
    const { userId } = request
    if (verifiedUserId !== request.userId) {
        throw Error('Not authorized')
    }

    const defaultZoneData = await getZoneData('default', { skipCache: true })

    const defaultBucket = defaultZoneData.bucket

    const user = await getUser('default', userId)
    const zones: {
        zone: string,
        ownerId: string,
        bucketName: string,
        directory: string
    }[] = []
    if (user) {
        for (const zone of (user.zones || [])) {
            const registeredZoneKey = `registered-zones/${zone}`
            if (!await objectExists(defaultBucket, registeredZoneKey)) {
                console.warn(`Registered zone ${zone} not found in bucket`)
                continue
            }
            const zoneInfo = JSON.parse(await getObjectContent(defaultBucket, registeredZoneKey))
            if (!isZoneInfo(zoneInfo)) {
                // during development, delete the object
                await deleteObject(defaultBucket, registeredZoneKey)
                throw Error('Invalid zone info in bucket')
            }
            zones.push(zoneInfo)
        }
    }

    return {
        type: 'getZones',
        zones
    }
}

export default getZonesHandler