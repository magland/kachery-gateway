import { GetZoneInfoRequest, GetZoneInfoResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";
import YAML from 'yaml'
import validateObject, { isArrayOf, isString } from "../../src/types/validateObject";

type ZoneDirectory = {
    zones: {
        name: string
        gatewayUrl: string
    }[]
}
const isZoneDirectory = (x: any): x is ZoneDirectory => {
    return validateObject(x, {
        zones: isArrayOf(y => (validateObject(y, {
            name: isString,
            gatewayUrl: isString
        })))
    })
}

const zoneDirectoryYaml = process.env['ZONE_DIRECTORY']
const zoneDirectory = zoneDirectoryYaml ? YAML.parse(zoneDirectoryYaml) : {zones: []}
if (!isZoneDirectory(zoneDirectory)) {
    throw Error('Invalid zone directory')
}

const getZoneInfoHandler = async (request: GetZoneInfoRequest, verifiedClientId?: NodeId): Promise<GetZoneInfoResponse> => {
    const { zoneName } = request.payload

    const a = zoneDirectory ? (
        (zoneDirectory.zones || []).filter(z => (z.name === zoneName))[0]
    ) : undefined

    if (!a) {
        return {
            type: 'getZoneInfo',
            found: false
        }
    }

    return {
        type: 'getZoneInfo',
        found: true,
        kacheryGatewayUrl: a.gatewayUrl
    }
}

export default getZoneInfoHandler