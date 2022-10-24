import { DeleteClientRequest, DeleteClientResponse } from "../../src/types/GuiRequest";
import { invalidateAllClients, invalidateClientInCache } from "../common/getDatabaseItems";
import { getAdminBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler";
import { deleteObject } from "../gatewayRequestHandlers/s3Helpers";

const deleteClientHandler = async (request: DeleteClientRequest, verifiedUserId?: string): Promise<DeleteClientResponse> => {
    const { clientId, ownerId } = request

    if (ownerId !== verifiedUserId) {
        throw Error('Mismatch between ownerId and verifiedUserId')
    }

    const adminBucket = getAdminBucket()
    const kk = `clients/${clientId}`

    await deleteObject(adminBucket, kk)

    // const db = firestoreDatabase()

    // const batch = db.batch();

    // const clientsCollection = db.collection('kachery-gateway.clients')
    // batch.delete(clientsCollection.doc(clientId.toString()))

    // await batch.commit()

    invalidateClientInCache(clientId.toString())
    invalidateAllClients()

    return {
        type: 'deleteClient'
    }
}

export default deleteClientHandler