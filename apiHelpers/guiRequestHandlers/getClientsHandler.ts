import { Client } from "../../src/types/Client";
import { GetClientsRequest, GetClientsResponse } from "../../src/types/GuiRequest";
import { getClient, getUser } from "../common/getDatabaseItems";

const getClientsHandler = async (request: GetClientsRequest, verifiedUserId?: string): Promise<GetClientsResponse> => {
    const { userId } = request
    if (verifiedUserId !== request.userId) {
        throw Error('Not authorized')
    }

    // const allClients = await getAllClients()
    // const clients = userId ? allClients.filter(c => (c.ownerId === userId)) : allClients

    const user = await getUser(userId)
    const clients: Client[] = []
    for (let clientId of user.clientIds) {
        const client = await getClient(clientId)
        clients.push(client)
    }

    // const clients: Client[] = []

    // const db = firestoreDatabase()

    // const clientsCollection = db.collection('kachery-gateway.clients')
    // const results2 = userId ?
    //     await clientsCollection.where('ownerId', '==', userId).get() :
    //     await clientsCollection.get()
    // for (let doc of results2.docs) {
    //     const x = doc.data()
    //     if (isClient(x)) {
    //         clients.push(x)
    //     }
    //     else {
    //         console.warn('Invalid client', x)
    //         // await doc.ref.delete() // only do this during development
    //     }
    // }

    return {
        type: 'getClients',
        clients
    }
}

export default getClientsHandler