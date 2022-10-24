import * as fs from 'fs'
import { JSONStringifyDeterministic } from "../../src/types/keypair"
import { isLogItem, LogItem } from "../../src/types/LogItem"
import { getAdminBucket } from './getBucket'
import { deleteObject, getObjectContent, listObjects, parseBucketUri, putObject } from "./s3Helpers"

const main = async () => {
    // const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    // process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    // const db = firestoreDatabase()

    // const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const adminBucket = getAdminBucket()

    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const logItemsList: {item: LogItem, key: string}[] = []

    // const logItemsCollection = db.collection('kachery-gateway.logItems')
    // const result = await logItemsCollection.orderBy('requestTimestamp', 'asc').limit(10000).get()
    // for (let doc of result.docs) {
    //     const logItem = doc.data()
    //     if (!isLogItem(logItem)) {
    //         console.warn(logItem)
    //         throw Error('Invalid log item in database')
    //     }
    //     // console.info(new Date(logItem.requestTimestamp).toISOString())
    //     logItems.push(logItem)
    // }

    const x = await listObjects(adminBucket, 'logItems/')
    for (let a of x) {
        const logItemJson = await getObjectContent(adminBucket, a.Key)
        const logItem = JSON.parse(logItemJson)
        if (!isLogItem(logItem)) {
            console.warn(logItem)
            throw Error('Invalid log item in bucket')
        }
        // console.info(new Date(logItem.requestTimestamp).toISOString())
        logItemsList.push({item: logItem, key: a.Key})
    }

    if (logItemsList.length === 0) {
        console.info('No log items to process. Exiting.')
        return
    }
    console.info('=================================================')
    console.info(`Processing ${logItemsList.length} log items.`)
    const logItemsJson = JSONStringifyDeterministic(logItemsList.map(x => (x.item)))
    const ts = new Date().toISOString()
    const fname = `log-${ts}.json`
    const objectKey = `logs/${fname}`
    console.info(`Writing ${fname}`)
    fs.writeFileSync(fname, logItemsJson)
    console.info(`Uploading log to admin bucket ${objectKey}`)
    await putObject(adminBucket, {
        Body: logItemsJson,
        Key: objectKey,
        Bucket: adminBucketName
    })
    console.info('Deleting log items')
    for (let i = 0; i < x.length; i++) {
        if (i % 50 === 0) {
            console.info(`Deleting log item ${i} / ${x.length}`)
        }
        const a = x[i]
        await deleteObject(adminBucket, a.Key)
    }
    console.info(`Processed ${logItemsList.length} log items.`)
    console.info('done')
}

// function splitIntoBatches(x: any[]): any[][] {
//     const batchSize = 400
//     const ret: any[][] = []
//     let i = 0
//     while (i < x.length) {
//         ret.push(x.slice(i, i + batchSize))
//         i += batchSize
//     }
//     return ret
// }

main()