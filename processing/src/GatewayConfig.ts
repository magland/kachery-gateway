import YAML from 'yaml'
import validateObject, { isArrayOf, isString, optional } from "./types/validateObject"

export type GatewayConfig = {
    buckets?: {
        name: string
        bucketUri: string
        bucketCredentials: string
        fallbackBucketUri?: string
        fallbackBucketCredentials?: string
    }[]
    zones?: { // obsolete
        name: string
        bucketUri: string
        bucketCredentials: string
        fallbackBucketUri?: string
        fallbackBucketCredentials?: string
    }[]
}

export const isGatewayConfig = (x: any): x is GatewayConfig => {
    return validateObject(x, {
        buckets: optional(isArrayOf(y => (validateObject(y, {
            name: isString,
            bucketUri: isString,
            bucketCredentials: isString,
            fallbackBucketUri: optional(isString),
            fallbackBucketCredentials: optional(isString)
        })))),
        zones: optional(isArrayOf(y => (validateObject(y, { // obsolete
            name: isString,
            bucketUri: isString,
            bucketCredentials: isString,
            fallbackBucketUri: optional(isString),
            fallbackBucketCredentials: optional(isString)
        }))))
    })
}

let _gatewayConfig: GatewayConfig | undefined = undefined
export const loadGatewayConfig = async () => {
    // this is async so that later we can load from a database
    if (_gatewayConfig) return _gatewayConfig
    const yaml = process.env['GATEWAY_CONFIG']
    if (!yaml) {
        throw Error('GATEWAY_CONFIG environment variable not set')
    }
    const a = YAML.parse(yaml)
    if (!isGatewayConfig(a)) {
        throw Error('Invalid gateway config')
    }
    _gatewayConfig = a
    return _gatewayConfig
}