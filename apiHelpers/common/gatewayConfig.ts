export type GatewayConfig = {
    buckets: {
        uri: string
    }[]
}

const gatewayConfig: GatewayConfig = {
    "buckets": [
        {
            "uri": "wasabi://kachery-cloud/projects/lqhzprbdrq?region=us-east-1"
        }
    ]
}

export default gatewayConfig