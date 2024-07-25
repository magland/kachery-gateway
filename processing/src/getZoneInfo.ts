import ObjectCache from "./ObjectCache"
import { ZoneInfo } from "./ZoneInfo"
import { getBucket, getFallbackBucket } from "./getBucket"
import { Bucket, getObjectContent } from "./s3Helpers"

export type ZoneData = {
    zone: string,
    ownerId: string,
    bucket: Bucket,
    fallbackBucket?: Bucket
    directory: string
}

const expirationMSec = 60 * 1000
const zoneInfoObjectCache = new ObjectCache<ZoneInfo>(expirationMSec)

export const getZoneInfo = async (zone: string): Promise<ZoneInfo> => {
    const x = zoneInfoObjectCache.get(zone)
    if (x) {
        return x
    }

    // hard-coded these for now, until we get them from the database

    let ownerId: string
    let bucketName: string
    let directory: string

    if (zone === 'default') {
        ownerId = 'github|magland'
        bucketName = 'default'
        directory = ''
    }
    else if (zone === 'franklab.default') {
        ownerId = 'github|lfrank'
        bucketName = 'franklab.default'
        directory = ''
    }
    else if (zone === 'franklab.collaborators') {
        ownerId = 'github|lfrank'
        bucketName = 'franklab.collaborators'
        directory = ''
    }
    else if (zone === 'franklab.public') {
        ownerId = 'github|lfrank'
        bucketName = 'franklab.public'
        directory = ''
    }
    else if (zone === 'aind') {
        ownerId = 'github|alejoe91'
        bucketName = 'aind'
        directory = ''
    }
    else if (zone === 'kempner') {
        ownerId = 'github|magland'
        bucketName = 'kempner-kachery-zone'
        directory = ''
    }
    else {
        if (zone === 'default') {
            throw Error('Unexpected _752d_')
        }
        const defaultZoneData = await getZoneData('default')
        const zoneKey = joinKeys(defaultZoneData.directory, `registered-zones/${zone}`)
        const x = await getObjectContent(defaultZoneData.bucket, zoneKey)
        const info = JSON.parse(x)
        ownerId = info.ownerId
        bucketName = info.bucketName
        directory = info.directory
        if (!ownerId) throw Error(`No ownerId for zone: ${zone}`)
        if (!bucketName) throw Error(`No bucketName for zone: ${zone}`)
    }
    const ret = {
        zone,
        ownerId,
        bucketName,
        directory
    }
    zoneInfoObjectCache.set(zone, ret)
    return ret
}

export const getZoneData = async (zone: string): Promise<ZoneData> => {
    const zoneInfo = await getZoneInfo(zone)
    const {ownerId, bucketName, directory} = zoneInfo
    const ret: ZoneData = {
        zone,
        ownerId,
        bucket: await getBucket(bucketName),
        fallbackBucket: await getFallbackBucket(bucketName),
        directory
    }
    return ret
}

export const invalidateZoneInfoInCache = (zone: string) => {
    const kk = `${zone}`
    zoneInfoObjectCache.delete(kk)
}

export const joinKeys = (a: string, b: string) => {
    if (!a) return b
    if (!b) return a
    if (a.endsWith('/')) return a + b
    else return a + '/' + b
}