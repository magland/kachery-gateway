import { GetZoneInfoRequest, GetZoneInfoResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";

// type ZoneDirectory = {
//     zones: {
//         name: string
//         gatewayUrl: string
//     }[]
// }
// const isZoneDirectory = (x: any): x is ZoneDirectory => {
//     return validateObject(x, {
//         zones: isArrayOf(y => (validateObject(y, {
//             name: isString,
//             gatewayUrl: isString
//         })))
//     })
// }

// not used any more
// const zoneDirectoryYaml = process.env['ZONE_DIRECTORY']
// const zoneDirectory = zoneDirectoryYaml ? YAML.parse(zoneDirectoryYaml) : {zones: []}
// if (!isZoneDirectory(zoneDirectory)) {
//     throw Error('Invalid zone directory')
// }

const getZoneInfoHandler = async (request: GetZoneInfoRequest, verifiedClientId?: NodeId): Promise<GetZoneInfoResponse> => {
    // const { zoneName } = request.payload

    // const a = zoneDirectory ? (
    //     (zoneDirectory.zones || []).filter(z => (z.name === zoneName))[0]
    // ) : undefined

    // if (!a) {
    //     return {
    //         type: 'getZoneInfo',
    //         found: false
    //     }
    // }

    // this is obsolete, but we need to keep this for old versions of the kachery-cloud python client
    return {
        type: 'getZoneInfo',
        found: true,
        // kacheryGatewayUrl: a.gatewayUrl
        kacheryGatewayUrl: 'https://kachery-gateway.figurl.org' // hard-coded
    }
}

export default getZoneInfoHandler