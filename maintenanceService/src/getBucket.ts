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
export const getAdminBucket = () => {
    const bucket: Bucket = {
        uri: process.env['ADMIN_BUCKET_URI'] || '',
        credentials: process.env['ADMIN_BUCKET_CREDENTIALS'] || ''
    }
    if (!bucket.uri) {
        throw Error(`Environment variable not set: ADMIN_BUCKET_URI`)
    }
    if (!bucket.credentials) {
        throw Error(`Environment variable not set: ADMIN_BUCKET_CREDENTIALS`)
    }
    return bucket
}