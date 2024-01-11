import { AddZoneRequest, AddZoneResponse } from "../../src/types/GuiRequest";
import { invalidateUserInCache } from "../common/getDatabaseItems";
import { ZoneInfo } from "../gatewayRequestHandlers/ZoneInfo";
import { getZoneData, invalidateZoneInfoInCache, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import { getObjectContent, objectExists, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const MAX_NUM_ZONES_PER_USER = 5

const addZoneHandler = async (request: AddZoneRequest, verifiedUserId?: string): Promise<AddZoneResponse> => {
    const { zone, ownerId, bucketName, directory } = request

    if (bucketName !== 'default') {
        throw Error('Only default bucket is supported')
    }
    if (directory !== `zones/${zone}`) {
        throw Error(`Invalid directory. Must be zones/${zone}`)
    }

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    if (!isAdminUser(ownerId)) {
        if ((zone !== ownerId) && (!zone.startsWith(ownerId + '.'))) {
            throw Error(`Invalid zone name for non-admin user: ${zone}`)
        }
    }

    const defaultZoneData = await getZoneData('default', {skipCache: true})

    const defaultBucket = defaultZoneData.bucket
    const {bucketName: defaultBucketName} = parseBucketUri(defaultBucket.uri)

    const userKey = joinKeys(defaultZoneData.directory, `users/${ownerId}`)
    let user: {[key: string]: any} = {}
    if (await objectExists(defaultBucket, userKey)) {
        user = JSON.parse(await getObjectContent(defaultBucket, userKey))
    }
    if ((user['zones'] || []).length >= MAX_NUM_ZONES_PER_USER) {
        throw Error(`Maximum number of zones per user is ${MAX_NUM_ZONES_PER_USER}`)
    }

    const zoneKey = `registered-zones/${zone}`
    const exists = await objectExists(defaultBucket, zoneKey)
    if (exists) {
        throw Error('Zone already registered.')
    }
    const zoneInfo: ZoneInfo = {
        zone,
        ownerId,
        bucketName,
        directory
    }
    await putObject(defaultBucket, {
        Key: zoneKey,
        Bucket: defaultBucketName,
        Body: JSON.stringify(zoneInfo, null, 4)
    })
    const existingUserZones = user['zones'] || []
    if (!existingUserZones.includes(zone)) {
        user['zones'] = [...existingUserZones, zone]
        await putObject(defaultBucket, {
            Key: userKey,
            Body: JSON.stringify(user, null, 4),
            Bucket: defaultBucketName
        })
    }

    invalidateZoneInfoInCache(zone)
    invalidateUserInCache('default', ownerId)
    
    return {
        type: 'addZone',
    }
}

export default addZoneHandler