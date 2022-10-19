import { GetRecentActivityRequest, GetRecentActivityResponse } from "../../src/types/GuiRequest";
import { isLogItem, LogItem } from "../../src/types/LogItem";
import firestoreDatabase from "../common/firestoreDatabase";
import isAdminUser from "./helpers/isAdminUser";

const getRecentActivityHandler = async (request: GetRecentActivityRequest, verifiedUserId?: string): Promise<GetRecentActivityResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not authorized')
    }

    const db = firestoreDatabase()
    const logItemsCollection = db.collection('kachery-gateway.logItems')
    const querySnapshot = await logItemsCollection.orderBy('requestTimestamp', 'desc').limit(50).get()
    const logItems: LogItem[] =[]
    for (let doc of querySnapshot.docs) {
        const logItem = doc.data()
        if (!isLogItem(logItem)) {
            throw Error('Invalid log item in database')
        }
        logItems.push(logItem)
    }

    return {
        type: 'getRecentActivity',
        logItems
    }
}

export default getRecentActivityHandler