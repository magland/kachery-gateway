import { useContext } from "react"
import GoogleSignInContext from "./GoogleSignInContext"

const useSignedIn = () => {
    return useContext(GoogleSignInContext)
}

export default useSignedIn