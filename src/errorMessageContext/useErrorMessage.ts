import { useContext } from "react"
import ErrorMessageContext from "./ErrorMessageContext"

const useErrorMessage = () => {
    return useContext(ErrorMessageContext)
}

export default useErrorMessage