import axios from "axios"
import { GuiRequest, GuiResponse } from "../types/GuiRequest"
import { getReCaptchaToken } from "./reCaptcha"

const guiApiRequest = async (request: GuiRequest, opts: {reCaptcha: boolean, setErrorMessage: (msg: string) => void}): Promise<GuiResponse | undefined> => {
    opts.setErrorMessage('')
    let request2: GuiRequest = request
    if (opts.reCaptcha) {
        const reCaptchaToken = await getReCaptchaToken()
        request2 = {...request, auth: {...request.auth, reCaptchaToken}}
    }
    try {
        const x = await axios.post('/api/gui', request2)
        return x.data
    }
    catch(err: any) {
        if (err.response) {
            opts.setErrorMessage(err.response.data)
            console.log(err.response)
            return undefined
        }
        else throw err
    }
}

export default guiApiRequest