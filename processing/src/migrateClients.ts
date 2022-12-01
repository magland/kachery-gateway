// import firestoreDatabase from './firestoreDatabase'
// import { getBucket } from './getBucket'
// import { getObjectContent, objectExists, parseBucketUri, putObject } from "./s3Helpers"
// import { isClient } from './types/Client'

// const migrateClients = async () => {
//     const bucket = getBucket()
//     const {bucketName} = parseBucketUri(bucket.uri)
//     const db = firestoreDatabase()

//     console.info('===============================================')
//     console.info('Migrating clients')
//     const clientsCollection = db.collection('kachery-gateway.clients')
//     const clientsSnaphot = await clientsCollection.get()
//     for (let doc of clientsSnaphot.docs) {
//         const client = doc.data()
//         if (!isClient(client)) throw Error('Invalid client in database')
//         const key = `clients/${client.clientId}`
//         const exists = await objectExists(bucket, key)
//         if (exists) {
//             console.info(`Client already exists in bucket: ${client.clientId}`)
//         }
//         else {
//             console.info(`Migrating client: ${client.clientId}`)
//             await putObject(bucket, {
//                 Key: key,
//                 Body: JSON.stringify(client, null, 4),
//                 Bucket: bucketName
//             })
//             const userId = client.ownerId
//             const userKey = `users/${userId}`
//             let user: {[key: string]: any} = {}
//             if (await objectExists(bucket, userKey)) {
//                 user = JSON.parse(await getObjectContent(bucket, userKey))
//             }
//             user['clientIds'] = [...(user['clientIds'] || []), client.clientId]
//             await putObject(bucket, {
//                 Key: userKey,
//                 Body: JSON.stringify(user, null, 4),
//                 Bucket: bucketName
//             })
//         }
//     }
// }

// migrateClients()