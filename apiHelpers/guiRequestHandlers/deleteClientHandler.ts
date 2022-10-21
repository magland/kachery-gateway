import { DeleteClientRequest, DeleteClientResponse } from "../../src/types/GuiRequest";
import firestoreDatabase from '../common/firestoreDatabase';
import { invalidateClientInCache } from "../common/getDatabaseItems";

const deleteClientHandler = async (request: DeleteClientRequest, verifiedUserId?: string): Promise<DeleteClientResponse> => {
    const { clientId, ownerId } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const db = firestoreDatabase()

    const batch = db.batch();

    const clientsCollection = db.collection('kachery-gateway.clients')
    batch.delete(clientsCollection.doc(clientId.toString()))

    await batch.commit()

    invalidateClientInCache(clientId.toString())

    return {
        type: 'deleteClient'
    }
}

export default deleteClientHandler