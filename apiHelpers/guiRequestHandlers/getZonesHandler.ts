import { GetZonesRequest, GetZonesResponse } from "../../src/types/GuiRequest";
import { getUser } from "../common/getDatabaseItems";
import { getZoneData } from "../gatewayRequestHandlers/getZoneInfo";
import { getObjectContent } from "../gatewayRequestHandlers/s3Helpers";

const getZonesHandler = async (request: GetZonesRequest, verifiedUserId?: string): Promise<GetZonesResponse> => {
    const { userId } = request
    if (verifiedUserId !== request.userId) {
        throw Error('Not authorized')
    }

    const defaultZoneData = await getZoneData('default')

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
            const zoneKey = `registered-zones/${zone}`
            const zoneInfo = JSON.parse(await getObjectContent(defaultBucket, zoneKey))
            zones.push(zoneInfo)
        }
    }

    return {
        type: 'getZones',
        zones
    }
}

export default getZonesHandler