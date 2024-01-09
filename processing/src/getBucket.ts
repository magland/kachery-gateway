import { loadGatewayConfig } from "./GatewayConfig"
import { Bucket } from "./s3Helpers"

export const getBucket = async (bucketName: string) => {
    const gatewayConfig = await loadGatewayConfig()
    const configBuckets = gatewayConfig.buckets || gatewayConfig.zones // .zones is obsolete
    if (!configBuckets) {
        throw Error(`No buckets in gateway config`)
    }
    const bb = configBuckets.filter(buck => (buck.name === bucketName))[0]
    if (!bb) {
        throw Error(`Bucket not found: ${bucketName}`)
    }
    const bucket: Bucket = {
        uri: bb.bucketUri,
        credentials: bb.bucketCredentials
    }
    if (!bucket.uri) {
        throw Error(`No bucket URI`)
    }
    if (!bucket.credentials) {
        throw Error(`No bucket credentials`)
    }
    return bucket
}

export const getFallbackBucket = async (bucketName: string) => {
    const gatewayConfig = await loadGatewayConfig()
    const configBuckets = gatewayConfig.buckets || gatewayConfig.zones // .zones is obsolete
    if (!configBuckets) {
        throw Error(`No buckets in gateway config`)
    }
    const bb = configBuckets.filter(buck => (buck.name === bucketName))[0]
    if (!bb) {
        throw Error(`Zone not found: ${bucketName}`)
    }

    if (!bb.fallbackBucketUri) {
        return undefined
    }
    const bucket: Bucket = {
        uri: bb.fallbackBucketUri || '',
        credentials: bb.fallbackBucketCredentials || ''
    }
    if (!bucket.uri) {
        throw Error(`No fallback bucket URI`)
    }
    if (!bucket.credentials) {
        throw Error(`No fallback bucket credentials`)
    }
    return bucket
}