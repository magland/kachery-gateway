import sleepMsec from "./sleepMsec"
import * as fs from 'fs'
import getS3Client from "./getS3Client"
import firestoreDatabase from "./firestoreDatabase"
import { copyObject, deleteObject, headObject } from "./s3Helpers"
import { LogItem } from "../../src/types/LogItem"

const main = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    const credentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})

    const bucket = {uri: 'wasabi://kachery-cloud?region=us-east-1', credentials}
    await sleepMsec(500)

    const filesCollection = db.collection('kacherycloud.files')
    const logItemsCollection = db.collection('kachery-gateway.logItems')

    // const result = await filesCollection.limit(1000).get()
    const result = await filesCollection.where('projectId', '==', 'lqqrbobsev').limit(10000).get()
    for (let doc of result.docs) {
        const requestTimestamp = Date.now()
        const file = doc.data()
        const {hash, hashAlg, projectId} = file
        console.info('======================================')
        console.info(`${projectId}: ${hashAlg}://${hash}`)
        const h = hash
        const key0 = `projects/${projectId}/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`
        const key1 = `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`
        let okay = false
        try {
            await headObject(bucket, key0)
            okay = true
        }
        catch {
            console.warn('Unable to find file.')
            // await sleepMsec(500)
        }
        if (okay) {
            console.info('Copying object')
            await copyObject(bucket, key0, key1)
            console.info('Deleting object')
            await deleteObject(bucket, key0)
            console.info('Deleting document')
            doc.ref.delete()
            const elapsed = Date.now() - requestTimestamp
            console.info(`Elapsed ${elapsed}`)
            const logItem: LogItem = {
                request: {
                    type: 'migrateProjectFile',
                    hash,
                    hashAlg,
                    projectId,
                    fileRecord: file
                },
                response: {},
                requestTimestamp,
                elapsed,
                requestHeaders: {}
            }
            await logItemsCollection.add(logItem)
        }
    }

    // const a = await listObjects(prefix)
    // for (let item of a) {
    //     if (item.Size > 0) {
    //         console.info('=============================')
    //         console.info(item.Key)
    //         // const newKey = 'sha1/' + item.Key.slice(prefix.length)
    //         // console.info(newKey)
    //         // await copyObject(bucket, item.Key, newKey)
    //         // await deleteObject(item.Key)
    //     }
    // }
}
main()