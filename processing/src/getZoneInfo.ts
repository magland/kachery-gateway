import { getBucket, getFallbackBucket } from "./getBucket"
import { Bucket } from "./s3Helpers"

export type ZoneInfo = {
    bucket: Bucket,
    fallbackBucket?: Bucket
    directory: string
}

export const getZoneInfo = async (zone: string): Promise<ZoneInfo> => {
    // hard-coded for now

    let bucketName: string
    let directory: string

    if (zone === 'default') {
        bucketName = 'default'
        directory = ''
    }
    else if (zone === 'franklab.default') {
        bucketName = 'franklab.default'
        directory = ''
    }
    else if (zone === 'franklab.collaborators') {
        bucketName = 'franklab.collaborators'
        directory = ''
    }
    else if (zone === 'franklab.public') {
        bucketName = 'franklab.public'
        directory = ''
    }
    else if (zone === 'aind') {
        bucketName = 'aind'
        directory = ''
    }
    else {
        throw Error(`Unexpected zone: ${zone}`)
    }
    return {
        bucket: await getBucket(bucketName),
        fallbackBucket: await getFallbackBucket(bucketName),
        directory
    }
}

export const joinKeys = (a: string, b: string) => {
    if (!a) return b
    if (!b) return a
    if (a.endsWith('/')) return a + b
    else return a + '/' + b
}