import { loadGatewayConfig } from "./GatewayConfig"
import { Bucket } from "./s3Helpers"

export const getBucket = async (zone: string) => {
    const gatewayConfig = await loadGatewayConfig()
    const zz = gatewayConfig.zones.filter(z => (z.name === zone))[0]
    if (!zz) {
        throw Error(`Zone not found: ${zone}`)
    }
    const bucket: Bucket = {
        uri: zz.bucketUri,
        credentials: zz.bucketCredentials
    }
    if (!bucket.uri) {
        throw Error(`No bucket URI`)
    }
    if (!bucket.credentials) {
        throw Error(`No bucket credentials`)
    }
    return bucket
}

export const getFallbackBucket = async (zone: string) => {
    const gatewayConfig = await loadGatewayConfig()
    const zz = gatewayConfig.zones.filter(z => (z.name === zone))[0]
    if (!zz) {
        throw Error(`Zone not found: ${zone}`)
    }

    if (!zz.fallbackBucketUri) {
        return undefined
    }
    const bucket: Bucket = {
        uri: zz.fallbackBucketUri || '',
        credentials: zz.fallbackBucketCredentials || ''
    }
    if (!bucket.uri) {
        throw Error(`No fallback bucket URI`)
    }
    if (!bucket.credentials) {
        throw Error(`No fallback bucket credentials`)
    }
    return bucket
}