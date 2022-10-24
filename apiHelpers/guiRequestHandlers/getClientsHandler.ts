import { GetClientsRequest, GetClientsResponse } from "../../src/types/GuiRequest";
import { isClient, Client } from "../../src/types/Client";
import firestoreDatabase from '../common/firestoreDatabase';
import isAdminUser from "./helpers/isAdminUser";
import { getAllClients } from "../common/getDatabaseItems";

const getClientsHandler = async (request: GetClientsRequest, verifiedUserId?: string): Promise<GetClientsResponse> => {
    const { userId } = request
    if (!userId) {
        if (!isAdminUser(verifiedUserId)) {
            throw Error('Not admin user.')
        }
    }
    if (verifiedUserId !== request.userId) {
        throw Error('Not authorized')
    }

    const allClients = await getAllClients()
    const clients = userId ? allClients.filter(c => (c.ownerId === userId)) : allClients

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