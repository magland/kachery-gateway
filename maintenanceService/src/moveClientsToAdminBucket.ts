import { isClient } from '../../src/types/Client'
import { JSONStringifyDeterministic } from '../../src/types/keypair'
import firestoreDatabase from './firestoreDatabase'
import { getAdminBucket } from './getBucket'
import { parseBucketUri, putObject } from "./s3Helpers"
import * as fs from 'fs'

const main = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    const adminBucket = getAdminBucket()

    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const clientsCollectionNew = db.collection('kachery-gateway.clients')
    const resultsNew = await clientsCollectionNew.get()
    for (let doc of resultsNew.docs) {
        const client = doc.data()
        if (!isClient(client)) {
            throw Error('Invalid client in database')
        }
        console.info('======================================')
        console.info(`Client: ${client.clientId} (${client.ownerId})`)
        await putObject(adminBucket, {
            Key: `clients/${client.clientId}`,
            Body: JSONStringifyDeterministic(client),
            Bucket: adminBucketName
        })
    }
}

main()