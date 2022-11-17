// import { DocumentSnapshot } from '@google-cloud/firestore'

import { DocumentSnapshot } from "@google-cloud/firestore"
import firestoreDatabase from "./firestoreDatabase"

const cleanupFindFileCache = async () => {
    const db = firestoreDatabase()

    const findFileCacheCollection = db.collection('kachery-gateway.findFileCache')
    let lastSnapshot: DocumentSnapshot | undefined = undefined
    while (true) {
        let qq = findFileCacheCollection.orderBy('timestampCreated', 'asc')
        qq = lastSnapshot ? qq.startAfter(lastSnapshot) : qq
        const result = await qq.limit(500).get() // can only delete 500 at a time
        if (result.docs.length === 0) {
            console.info('No more findFile cache items to process. Exiting.')
            return
        }
        console.info(`Processing ${result.docs.length} findFile cache items`)
        lastSnapshot = result.docs[result.docs.length - 1]
        const docsToDelete = []
        for (let doc of result.docs) {
            const cacheRecord = doc.data()
            const elapsed = Date.now() - cacheRecord.timestampCreated
            if (elapsed > 1000 * 60 * 60) {
                docsToDelete.push(doc)
            }
        }
        if (docsToDelete.length > 0) {
            console.info(`Deleting ${docsToDelete.length} expired cache items`)
            const deleteBatch = db.batch()
            for (let doc of docsToDelete) {
                deleteBatch.delete(doc.ref)
            }
            await deleteBatch.commit()
        }
        else {
            console.info('No more expired cache items. Exiting')
            return
        }
    }
}

cleanupFindFileCache()