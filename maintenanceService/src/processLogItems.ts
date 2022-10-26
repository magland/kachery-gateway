import { DocumentSnapshot } from '@google-cloud/firestore'
import * as fs from 'fs'
import { JSONStringifyDeterministic } from "./types/keypair"
import { isLogItem, LogItem } from "./types/LogItem"
import firestoreDatabase from './firestoreDatabase'
import { getAdminBucket } from './getBucket'
import { parseBucketUri, putObject } from "./s3Helpers"
import splitIntoBatches from './splitIntoBatches'

const processLogItems = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    console.info('Process log items')

    // const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const adminBucket = getAdminBucket()

    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const logItems: LogItem[] = []

    const logItemsCollection = db.collection('kachery-gateway.logItems')
    let lastSnapshot: DocumentSnapshot | undefined = undefined
    while (true) {
        let qq = logItemsCollection.orderBy('requestTimestamp', 'asc')
        qq = lastSnapshot ? qq.startAfter(lastSnapshot) : qq
        const result = await qq.limit(10000).get()
        if (result.docs.length === 0) {
            console.info('No more log items to process. Exiting.')
            return
        }
        lastSnapshot = result.docs[result.docs.length - 1]
        for (let doc of result.docs) {
            const logItem = doc.data()
            if (!isLogItem(logItem)) {
                console.warn(logItem)
                throw Error('Invalid log item in database')
            }
            // console.info(new Date(logItem.requestTimestamp).toISOString())
            logItems.push(logItem)
        }

        // console.info('Loading log items')
        // const x = await listObjects(adminBucket, 'logItems/')
        // for (let i = 0; i < x.length; i++) {
        //     if (i % 10 === 0) {
        //         console.info(`Loading item ${i} / ${x.length}`)
        //     }
        //     const a = x[i]
        //     const logItemJson = await getObjectContent(adminBucket, a.Key)
        //     const logItem = JSON.parse(logItemJson)
        //     if (!isLogItem(logItem)) {
        //         console.warn(logItem)
        //         throw Error('Invalid log item in bucket')
        //     }
        //     // console.info(new Date(logItem.requestTimestamp).toISOString())
        //     logItemsList.push({item: logItem, key: a.Key})
        // }

        console.info('=================================================')
        console.info(`Processing ${logItems.length} log items.`)
        const logItemsJson = JSONStringifyDeterministic(logItems)
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
        const docBatches = splitIntoBatches(result.docs, 400)
        for (let i = 0; i < docBatches.length; i++) {
            const docBatch = docBatches[i]
            console.info(`Processing batch ${i} / ${docBatches.length}`)
            const deleteBatch = db.batch()
            for (let doc of docBatch) {
                deleteBatch.delete(doc.ref)
            }
            await deleteBatch.commit()
        }
        console.info(`Processed ${logItems.length} log items.`)
    }
}

processLogItems()