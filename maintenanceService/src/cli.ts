import sleepMsec from "./sleepMsec"
import firestoreDatabase from '../../apiHelpers/common/firestoreDatabase'
import { LogItem, isLogItem } from '../../src/types/LogItem'
import { ProjectUsage, isProjectUsage } from '../../src/types/ProjectUsage'
import fs from 'fs'

const initialProjectUsage = (projectId: string): ProjectUsage => {
    return {
        projectId
    }
}

// const addTimestampsToFiles = async (db: Firestore) => {
//     // Example of adding a field to a collection
//     console.info('Adding timestamps to files')
//     const C = db.collection('kacherycloud.files')
//     const query = C.orderBy(FieldPath.documentId()).limit(300)
//     let docSnapshots = await query.get()
//     let ct = 0
//     while (docSnapshots.size > 0) {
//         console.info(ct)
//         const batch = db.batch()
//         let batchSize = 0
//         for (let doc of docSnapshots.docs) {
//             if (!doc.data()['timestampCreated']) {
//                 batch.update(doc.ref, {timestampCreated: Date.now()})
//                 batchSize ++
//             }
//         }
//         console.info('Number of changes to make', batchSize)
//         if (batchSize > 0) {
//             await batch.commit()
//         }
//         ct += docSnapshots.size

//         const lastVisible = docSnapshots.docs[docSnapshots.docs.length - 1]
//         const query2 = C.orderBy(FieldPath.documentId()).startAfter(lastVisible).limit(300)
//         docSnapshots = await query2.get()
//     }
// }

const main = async () => {
    const credentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = credentials
    const db = firestoreDatabase()

    // Example of adding a field to a collection
    // await addTimestampsToFiles(db)

    const usageLogColletion = db.collection('kacherycloud.usageLog')
    const projectUsagesCollection = db.collection('kacherycloud.projectUsages')
    const filesCollection = db.collection('kacherycloud.files')
    
    while (true) {
        // const a = await projectUsagesCollection.get()
        // for (let doc of a.docs) {
        //     const pu = doc.data()
        //     if (!isProjectUsage(pu)) {
        //         console.warn(pu)
        //         throw Error('Invalid project usage in database')
        //     }
        //     console.log('=============================')
        //     console.info(pu.projectId)
        //     console.info(pu)
        // }

        const result = await usageLogColletion.orderBy('timestamp').limit(500).get()
        if (result.docs.length > 0) {

            const usageByProject: {[key: string]: ProjectUsage} = {}
            const filesAccessed: {projectId: string, hashAlg: string, hash : string, timestamp: number}[] = []

            const processLogItem = async (logItem: LogItem) => {
                const timestampString = new Date(logItem.timestamp).toUTCString()
                console.info(`${timestampString} ${logItem.type} ${logItem.projectId} ${logItem.userId}`)
                const projectId = logItem.projectId
                if ((projectId) && (!usageByProject[projectId])) {
                    const snapshot = await projectUsagesCollection.doc(projectId).get()
                    const projectUsage0 = snapshot.exists ? snapshot.data() : initialProjectUsage(projectId)
                    if (!isProjectUsage(projectUsage0)) {
                        console.warn(projectUsage0)
                        throw Error('Invalid project usage in database')
                    }
                    usageByProject[projectId] = projectUsage0
                }
                const projectUsage = projectId ? usageByProject[projectId] : {projectId} as ProjectUsage
                if (projectId) {
                    projectUsage.timestampLastActivity = Math.max(projectUsage.timestampLastActivity || 0, logItem.timestamp)
                }
                let handled = false
                if (logItem.type === 'initiateIpfsUpload') {
                    projectUsage.numInitiatedIpfsUploads = (projectUsage.numInitiatedIpfsUploads || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'finalizeIpfsUpload') {
                    projectUsage.numFinalizedIpfsUploads = (projectUsage.numFinalizedIpfsUploads || 0) + 1
                    projectUsage.numIpfsBytesUploaded = (projectUsage.numIpfsBytesUploaded || 0) + logItem.size
                    handled = true
                }
                else if (logItem.type === 'findIpfsFile') {
                    projectUsage.numIpfsFileFinds = (projectUsage.numIpfsFileFinds || 0) + 1
                    if (logItem.found) {
                        projectUsage.numIpfsFileFindBytes = (projectUsage.numIpfsFileFindBytes || 0) + (logItem.size || 0)
                    }
                    handled = true
                }
                else if (logItem.type === 'initiateFileUpload') {
                    projectUsage.numInitiatedFileUploads = (projectUsage.numInitiatedFileUploads || 0) + 1
                    // mark this as an access, even if already uploaded
                    filesAccessed.push({
                        projectId: logItem.projectId,
                        hashAlg: logItem.hashAlg,
                        hash: logItem.hash,
                        timestamp: logItem.timestamp
                    })
                    handled = true
                }
                else if (logItem.type === 'finalizeFileUpload') {
                    projectUsage.numFinalizedFileUploads = (projectUsage.numFinalizedFileUploads || 0) + 1
                    projectUsage.numFileBytesUploaded = (projectUsage.numFileBytesUploaded || 0) + logItem.size
                    handled = true
                }
                else if (logItem.type === 'findFile') {
                    projectUsage.numFileFinds = (projectUsage.numFileFinds || 0) + 1
                    if (logItem.found) {
                        projectUsage.numFileFindBytes = (projectUsage.numFileFindBytes || 0) + (logItem.size || 0)
                    }
                    if (logItem.projectId) { // should always be true
                        filesAccessed.push({
                            projectId: logItem.projectId,
                            hashAlg: logItem.hashAlg,
                            hash: logItem.hash,
                            timestamp: logItem.timestamp
                        })
                        handled = true
                    }
                }
                else if (logItem.type === 'subscribeToPubsubChannel') {
                    if (logItem.channelName === 'feedUpdates') {
                        projectUsage.numSubscribeToFeedUpdates = (projectUsage.numSubscribeToFeedUpdates || 0) + 1
                        handled = true
                    }
                    else if (logItem.channelName === 'provideTasks') {
                        projectUsage.numSubscribeToProvideTasks = (projectUsage.numSubscribeToProvideTasks || 0) + 1
                        handled = true
                    }
                    else if (logItem.channelName === 'requestTasks') {
                        projectUsage.numSubscribeToRequestTasks = (projectUsage.numSubscribeToRequestTasks || 0) + 1
                        handled = true
                    }
                }
                else if (logItem.type === 'publishToPubsubChannel') {
                    if (logItem.channelName === 'feedUpdates') {
                        projectUsage.numPublishToFeedUpdates = (projectUsage.numPublishToFeedUpdates || 0) + 1
                        handled = true
                    }
                    else if (logItem.channelName === 'provideTasks') {
                        projectUsage.numPublishToProvideTasks = (projectUsage.numPublishToProvideTasks || 0) + 1
                        handled = true
                    }
                    else if (logItem.channelName === 'requestTasks') {
                        projectUsage.numPublishToRequestTasks = (projectUsage.numPublishToRequestTasks || 0) + 1
                        handled = true
                    }
                }
                else if (logItem.type === 'initiateTaskResultUpload') {
                    projectUsage.numInitiatedTaskResultUploads = (projectUsage.numInitiatedTaskResultUploads || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'finalizeTaskResultUpload') {
                    projectUsage.numFinalizedTaskResultUploads = (projectUsage.numFinalizedTaskResultUploads || 0) + 1
                    projectUsage.numTaskResultBytesUploaded = (projectUsage.numTaskResultBytesUploaded || 0) + logItem.size
                    handled = true
                }
                else if (logItem.type === 'createFeed') {
                    projectUsage.numFeedsCreated = (projectUsage.numFeedsCreated || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'getFeedInfo') {
                    projectUsage.numGetFeedInfo = (projectUsage.numGetFeedInfo || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'getFeedMessages') {
                    projectUsage.numFeedMessagesRead = (projectUsage.numFeedMessagesRead || 0) + logItem.numMessages
                    handled = true
                }
                else if (logItem.type === 'appendFeedMessages') {
                    projectUsage.numFeedMessagesAppended = (projectUsage.numFeedMessagesAppended || 0) + logItem.numMessages
                    projectUsage.numFeedMessageBytesAppended = (projectUsage.numFeedMessageBytesAppended || 0) + logItem.size
                    handled = true
                }
                else if (logItem.type === 'getMutable') {
                    projectUsage.numGetMutable = (projectUsage.numGetMutable || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'setMutable') {
                    projectUsage.numSetMutable = (projectUsage.numSetMutable || 0) + 1
                    handled = true
                }
                else if (logItem.type === 'deleteMutable') {
                    projectUsage.numDeleteMutable = (projectUsage.numDeleteMutable || 0) + 1
                    handled = true
                }
                if (handled) {
                    projectUsage.numLogItems = (projectUsage.numLogItems || 0) + 1
                }
                return handled
            }

            console.log(`Processing ${result.docs.length} log items`)
            for (let usageDoc of result.docs) {
                const logItem = usageDoc.data()
                if (!isLogItem(logItem)) {
                    console.warn('Invalid log item:')
                    console.warn(logItem)
                    // if ((logItem.type === 'initiateTaskResultUpload') && (logItem.taskType) && (logItem.taskInputHash)) {
                    //     await usageDoc.ref.delete() // only during development
                    // }
                    // else if ((logItem.type === 'finalizeTaskResultUpload') && (logItem.taskType) && (logItem.taskInputHash)) {
                    //     await usageDoc.ref.delete() // only during development
                    // }
                    // else {
                    //     throw Error('Invalid log item')
                    // }
                    throw Error('Invalid log item')
                    // await usageDoc.ref.delete() // only during development
                }
                else {
                    const handled = await processLogItem(logItem)
                    if (handled) {
                        usageDoc.ref.delete()
                    }
                    else {
                        console.warn(logItem)
                        throw Error(`Did not handle log item ${logItem.type}`)
                    }
                }
            }
            for (let projectId in usageByProject) {
                await projectUsagesCollection.doc(projectId).set(usageByProject[projectId])
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // need to go through these hoops so we don't update the same document more than once in this batch
            const accessedKeyUpdates: {[fKey: string]: number} = {}
            for (let x of filesAccessed) {
                const {projectId, hashAlg, hash} = x
                const fKey = `${projectId}:${hashAlg}:${hash}`
                if (fKey in accessedKeyUpdates) {
                    accessedKeyUpdates[fKey] = Math.max(accessedKeyUpdates[fKey], x.timestamp)
                }
                else {
                    accessedKeyUpdates[fKey] = x.timestamp
                }
            }
            for (let fKey in accessedKeyUpdates) {
                const fileSnapshot = await filesCollection.doc(fKey).get()
                if (fileSnapshot.exists) {
                    console.info(`Updating access timestamp for file: ${fKey}`)
                    fileSnapshot.ref.update({
                        timestampAccessed: accessedKeyUpdates[fKey]
                    })
                }
            }
            /////////////////////////////////////////////////////////////////////////////////////////////
        }
        else {
            console.warn('No more log items to process. Waiting 60 seconds.')
            await sleepMsec(60 * 1000)
        }
        
        await sleepMsec(500)
    }
}
main()