import { Client } from "../../src/types/Client";
import { GetClientInfoRequest, GetClientInfoResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";
import firestoreDatabase from '../common/firestoreDatabase';
import { getClient } from "../common/getDatabaseItems";

const getClientInfoHandler = async (request: GetClientInfoRequest, verifiedClientId?: NodeId): Promise<GetClientInfoResponse> => {
    const { clientId } = request.payload

    const db = firestoreDatabase()
    let client: Client
    try {
        client = await getClient(clientId.toString())
    }
    catch {
        return {
            type: 'getClientInfo',
            found: false
        }
    }

    // not sure if we want to restrict
    // if (client.clientId !== verifiedClientId) {
    //     throw Error('Not authorized to access this client info')
    // }

    return {
        type: 'getClientInfo',
        found: true,
        client
    }
}

export default getClientInfoHandler