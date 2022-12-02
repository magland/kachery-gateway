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
    for (let clientId of (user.clientIds || [])) {
        const client = await getClient(clientId)
        clients.push(client)
    }

    return {
        type: 'getClients',
        clients
    }
}

export default getClientsHandler