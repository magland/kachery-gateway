import YAML from 'yaml'
import validateObject, { isArrayOf, isString, optional } from "../../src/types/validateObject"

export type GatewayConfig = {
    zones: {
        name: string
        bucketUri: string
        bucketCredentials: string
        fallbackBucketUri?: string
        fallbackBucketCredentials?: string
    }[]
}

export const isGatewayConfig = (x: any): x is GatewayConfig => {
    return validateObject(x, {
        zones: isArrayOf(y => (validateObject(y, {
            name: isString,
            bucketUri: isString,
            bucketCredentials: isString,
            fallbackBucketUri: optional(isString),
            fallbackBucketCredentials: optional(isString)
        })))
    })
}

let _gatewayConfig: GatewayConfig | undefined = undefined
export const loadGatewayConfig = async () => {
    // this is async so that later we can load from a database
    if (_gatewayConfig) return _gatewayConfig
    const yaml = process.env['GATEWAY_CONFIG'] || (
`
zones:
  -
    name: default
    bucketUri: ${process.env['BUCKET_URI'] || ''}
    bucketCredentials: ${process.env['BUCKET_CREDENTIALS'] || ''}
    fallbackBucketUri: ${process.env['FALLBACK_BUCKET_URI'] || ''}
    fallbackBucketCredentials: ${process.env['FALLBACK_BUCKET_CREDENTIALS'] || ''}
`
    )
    const a = YAML.parse(yaml)
    if (!isGatewayConfig(a)) {
        throw Error('Invalid gateway config')
    }
    _gatewayConfig = a
    return _gatewayConfig
}