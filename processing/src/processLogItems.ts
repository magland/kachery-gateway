// import { DocumentSnapshot } from '@google-cloud/firestore'

import { DocumentSnapshot } from "@google-cloud/firestore"
import * as fs from 'fs'
import firestoreDatabase from "./firestoreDatabase"
import { getBucket } from "./getBucket"
import { parseBucketUri, putObject } from "./s3Helpers"
import splitIntoBatches from "./splitIntoBatches"
import { isLogItem, LogItem } from "./types/LogItem"

const processLogItems = async () => {
    const db = firestoreDatabase()

    const bucket = getBucket()
    const {bucketName} = parseBucketUri(bucket.uri)

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
            const type0 = logItem.request.type || (logItem.request.payload || {}).type
            if ([
                "initiateFileUpload",
                "finalizeFileUpload",
                "addClient",
                "deleteClient",
                "setClientInfo",
                "migrateClient",
                "migrateProjectFile"
            ].includes(type0)) {
                logItems.push(logItem)
            }
            else {
                if (type0 === 'getZoneInfo') {
                    console.warn(`WARNING: Unexpected log item type: ${type0}`)
                }
                else {
                    throw Error(`Unexpected log item type: ${type0}`)
                }
            }
            // console.info(new Date(logItem.requestTimestamp).toISOString())
        }

        console.info('=================================================')
        console.info(`Processing ${logItems.length} log items.`)
        const logItemsJson = JSON.stringify(logItems) // deterministic stringify can be slow here
        const ts = new Date().toISOString()
        const fname = `log-${ts}.json`
        const objectKey = `logs/${fname}`
        console.info(`Writing ${fname}`)
        fs.writeFileSync(fname, logItemsJson)
        console.info(`Uploading log to admin bucket ${objectKey}`)
        await putObject(bucket, {
            Body: logItemsJson,
            Key: objectKey,
            Bucket: bucketName
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