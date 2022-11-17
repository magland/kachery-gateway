import { Button, Input } from "@material-ui/core";
import { FunctionComponent, useCallback, useState } from "react";
import validateObject, { isBoolean, isNumber, isString, optional } from "../../types/validateObject";

type Props ={
	onChange: () => void
}

export type GitHubTokenInfo = {
    token?: string
    userId?: string
    userIdTimestamp?: number
    isPersonalAccessToken?: boolean
}

export const isGithubTokenInfo = (x: any): x is GitHubTokenInfo => {
    return validateObject(x, {
        token: optional(isString),
        userId: optional(isString),
        userIdTimestamp: optional(isNumber),
        isPersonalAccessToken: optional(isBoolean)
    })
}

export const setGitHubTokenInfoToLocalStorage = (tokenInfo: GitHubTokenInfo) => {
    localStorage.setItem('githubToken', JSON.stringify(tokenInfo))
}

export const getGitHubTokenInfoFromLocalStorage = (): GitHubTokenInfo | undefined => {
    const a = localStorage.getItem('githubToken')
    if (!a) return undefined
    try {
        const b = JSON.parse(a)
        if (isGithubTokenInfo(b)) {
            return b
        }
        else {
            console.warn(b)
            console.warn('Invalid GitHub token info.')
            localStorage.removeItem('githubToken')
            return undefined
        }
    }
    catch {
        console.warn(a)
        console.warn('Error with github token info.')
        return undefined
    }
}

const PersonalAccessTokenWindow: FunctionComponent<Props> = ({onChange}) => {
	const [newToken, setNewToken] = useState('')
	const handleNewTokenChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((e) => {
        setNewToken(e.target.value as string)
	}, [])
	const handleSubmit = useCallback(() => {
		setGitHubTokenInfoToLocalStorage({token: newToken, isPersonalAccessToken: true})
		setNewToken('')
		onChange()
	}, [newToken, onChange])

	const oldTokenInfo = getGitHubTokenInfoFromLocalStorage()

	return (
		<div>
			<p>
				To write to public GitHub repositories and to read and write from private GitHub repositories
				you will need to set a GitHub access token. This token will be stored in your browser's local
				storage. You should create a <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" target="_blank" rel="noreferrer">personal access token</a>
				&nbsp;with the least amount of permissions needed.
			</p>
			<p style={{fontWeight: 'bold'}}>
				Use the classic type <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" target="_blank" rel="noreferrer">personal access token</a> with repo scope.
			</p>

			<Input title="GitHub personal access token" type="text" value={newToken} onChange={handleNewTokenChange} />
			{
				newToken && (
					<div><Button onClick={handleSubmit}>Submit</Button></div>
				)
			}
			{
				oldTokenInfo?.token ? (
					<span>
						<p style={{color: 'green'}}>GitHub access token has been set.</p>
					</span>
				) : (
					<span>
						<p style={{color: 'red'}}>GitHub access token not set.</p>
					</span>
				)
			}
		</div>
	)
}

export default PersonalAccessTokenWindow
