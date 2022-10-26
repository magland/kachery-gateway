import * as fs from 'fs'
import { Client } from "./types/Client"
import { LogItem } from "./types/LogItem"
import firestoreDatabase from "./firestoreDatabase"

const migrateClients = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    const clientsCollectionOld = db.collection('kacherycloud.clients')
    const clientsCollectionNew = db.collection('kachery-gateway.clients')
    const logItemsCollection = db.collection('kachery-gateway.logItems')

    // const result = await filesCollection.limit(1000).get()
    const resultsOld = await clientsCollectionOld.get()
    const resultsNew = await clientsCollectionNew.get()
    const newClientIds = resultsNew.docs.map(doc => (doc.data()['clientId']))
    for (let doc of resultsOld.docs) {
        const requestTimestamp = Date.now()
        const clientOld = doc.data()
        const clientNew: Client = {
            clientId: clientOld['clientId'],
            ownerId: clientOld['ownerId'],
            timestampCreated: clientOld['timestampCreated'],
            label: clientOld['label'],
            privateKeyHex: clientOld['privateKeyHex']
        }
        console.info('=========================================')
        console.info(`Client: ${clientNew.clientId} (${clientNew.ownerId})`)
        if (newClientIds.includes(clientNew.clientId)) {
            console.info('Already exists.')
        }
        else {
            console.info('Migrating client')
            clientsCollectionNew.doc(clientNew.clientId.toString()).set(clientNew)
            const logItem: LogItem = {
                request: {
                    type: 'migrateClient',
                    client: clientNew
                },
                response: {},
                requestTimestamp,
                elapsed: Date.now() - requestTimestamp,
                requestHeaders: {}
            }
            await logItemsCollection.add(logItem)
        }
    }
}
migrateClients()