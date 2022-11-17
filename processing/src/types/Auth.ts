import validateObject, { isString, optional } from "./validateObject"

export type Auth = {
    userId?: string,
    googleIdToken?: string
    githubAccessToken?: string
    reCaptchaToken?: string
}

export const isAuth = (x: any): x is Auth => {
    return validateObject(x, {
        userId: optional(isString),
        googleIdToken: optional(isString),
        githubAccessToken: optional(isString),
        reCaptchaToken: optional(isString)
    })
}