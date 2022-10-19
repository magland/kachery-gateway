import { Auth, isAuth } from "./Auth"
import { isLogItem, LogItem } from "./LogItem"
import validateObject, { isArrayOf, isEqualTo, isOneOf } from "./validateObject"

//////////////////////////////////////////////////////////////////////////////////
// getProjectsForUser

export type GetRecentActivityRequest = {
    type: 'getRecentActivity'
    auth: Auth
}

export const isGetRecentActivityRequest = (x: any): x is GetRecentActivityRequest => {
    return validateObject(x, {
        type: isEqualTo('getRecentActivity'),
        auth: isAuth
    })
}

export type GetRecentActivityResponse = {
    type: 'getRecentActivity'
    logItems: LogItem[]
}

export const isGetRecentActivityResponse = (x: any): x is GetRecentActivityResponse => {
    return validateObject(x, {
        type: isEqualTo('getRecentActivity'),
        logItems: isArrayOf(isLogItem)
    })
}


//////////////////////////////////////////////////////////////////////////////////

export type GuiRequest =
    GetRecentActivityRequest

export const isGuiRequest = (x: any): x is GuiRequest => {
    return isOneOf([
        isGetRecentActivityRequest
    ])(x)
}

export type GuiResponse =
    GetRecentActivityResponse

export const isGuiResponse = (x: any): x is GuiResponse => {
    return isOneOf([
        isGetRecentActivityResponse
    ])(x)
}