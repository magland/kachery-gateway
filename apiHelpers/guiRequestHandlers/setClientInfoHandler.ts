import { isClient } from "../../src/types/Client";
import { SetClientInfoRequest, SetClientInfoResponse } from "../../src/types/GuiRequest";
import firestoreDatabase from '../common/firestoreDatabase';
import { invalidateClientInCache } from "../common/getDatabaseItems";

const setClientInfoHandler = async (request: SetClientInfoRequest, verifiedUserId?: string): Promise<SetClientInfoResponse> => {
    const { clientId, label } = request

    const db = firestoreDatabase()
    const collection = db.collection('kachery-gateway.clients')
    let docSnapshot = await collection.doc(clientId.toString()).get()

    if (!docSnapshot.exists) {
        throw Error('Client does not exist in setClientInfoHandler')
    }

    const client = docSnapshot.data()
    if (!isClient(client)) {
        throw Error('Invalid client in database')
    }
    if (client.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set client info')
    }
    
    if (label !== undefined) {
        client.label = label
    }
    await collection.doc(clientId.toString()).set(client)

    invalidateClientInCache(clientId.toString())

    return {
        type: 'setClientInfo'
    }
}

export default setClientInfoHandler