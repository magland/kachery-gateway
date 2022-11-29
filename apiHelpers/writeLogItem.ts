import { LogItem } from '../src/types/LogItem'
import { getMongoClient } from './common/getMongoClient'

// const adminBucket = getAdminBucket()

const writeLogItem = async (logItem: LogItem) => {
    const logItem2 = {...logItem}
    logItem2.request = {...logItem2.request}
    delete logItem2.request['signature']
    delete logItem2.request['githubAccessToken']

    const client = await getMongoClient()
    const logItemsCollection = client.db('kachery-gateway').collection('logItems')
    logItemsCollection.insertOne(logItem2)

    // const db = firestoreDatabase()
    // const logItemsCollection = db.collection('kachery-gateway.logItems')
    // await logItemsCollection.add(logItem2)
}

export default writeLogItem