import { GetZoneInfoRequest, GetZoneInfoResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";

const zonesConfigJson = process.env['KACHERY_ZONES']
const zonesConfig: {
    zoneName: string
    kacheryGatewayUrl: string
}[] | undefined = zonesConfigJson ? JSON.parse(zonesConfigJson) : undefined

const getZoneInfoHandler = async (request: GetZoneInfoRequest, verifiedClientId?: NodeId): Promise<GetZoneInfoResponse> => {
    const { zoneName } = request.payload

    const a = zonesConfig ? (
        zonesConfig.filter(z => (z.zoneName === zoneName))[0]
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
        kacheryGatewayUrl: a.kacheryGatewayUrl
    }
}

export default getZoneInfoHandler