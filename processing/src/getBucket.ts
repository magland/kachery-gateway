import { Bucket } from "./s3Helpers"

export const getBucket = () => {
    const bucket: Bucket = {
        uri: process.env['BUCKET_URI'] || '',
        credentials: process.env['BUCKET_CREDENTIALS'] || ''
    }
    if (!bucket.uri) {
        throw Error(`Environment variable not set: BUCKET_URI`)
    }
    if (!bucket.credentials) {
        throw Error(`Environment variable not set: BUCKET_CREDENTIALS`)
    }
    return bucket
}

export const getFallbackBucket = () => {
    if (!process.env['FALLBACK_BUCKET_URI']) {
        return undefined
    }
    const bucket: Bucket = {
        uri: process.env['FALLBACK_BUCKET_URI'] || '',
        credentials: process.env['FALLBACK_BUCKET_CREDENTIALS'] || ''
    }
    if (!bucket.uri) {
        throw Error(`Environment variable not set: FALLBACK_BUCKET_URI`)
    }
    if (!bucket.credentials) {
        throw Error(`Environment variable not set: FALLBACK_BUCKET_CREDENTIALS`)
    }
    return bucket
}