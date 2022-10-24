import { isClient } from "../../src/types/Client";
import { SetClientInfoRequest, SetClientInfoResponse } from "../../src/types/GuiRequest";
import { JSONStringifyDeterministic } from "../../src/types/keypair";
import firestoreDatabase from '../common/firestoreDatabase';
import { getClient, invalidateAllClients, invalidateClientInCache } from "../common/getDatabaseItems";
import { getAdminBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler";
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";

const setClientInfoHandler = async (request: SetClientInfoRequest, verifiedUserId?: string): Promise<SetClientInfoResponse> => {
    const { clientId, label } = request

    const client0 = await getClient(clientId.toString())
    const client = {...client0}

    // const db = firestoreDatabase()
    // const collection = db.collection('kachery-gateway.clients')
    // let docSnapshot = await collection.doc(clientId.toString()).get()

    // if (!docSnapshot.exists) {
    //     throw Error('Client does not exist in setClientInfoHandler')
    // }

    // const client = docSnapshot.data()
    // if (!isClient(client)) {
    //     throw Error('Invalid client in database')
    // }
    if (client.ownerId !== verifiedUserId) {
        throw Error('Not authorized to set client info')
    }
    
    if (label !== undefined) {
        client.label = label
    }
    // await collection.doc(clientId.toString()).set(client)

    const adminBucket = getAdminBucket()
    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)
    const kk = `clients/${clientId}`

    await putObject(adminBucket, {
        Key: kk,
        Body: JSONStringifyDeterministic(client),
        Bucket: adminBucketName
    })

    invalidateClientInCache(clientId.toString())
    invalidateAllClients()

    return {
        type: 'setClientInfo'
    }
}

export default setClientInfoHandler