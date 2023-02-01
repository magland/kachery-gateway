import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import useErrorMessage from "../../errorMessageContext/useErrorMessage";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { GetAuthorizationSettingsYamlRequest, isGetAuthorizationSettingsYamlResponse, isSetAuthorizationSettingsYamlResponse, SetAuthorizationSettingsYamlRequest } from "../../types/GuiRequest";
import guiApiRequest from "../guiApiRequest";
import MonacoEditor from 'react-monaco-editor';
import YAML from 'yaml'
import { Button } from "@material-ui/core";
import { isAuthorizationSettings } from "../../types/AuthorizationSettings";
import useRoute from "../useRoute";

type Props ={
	width: number
	height: number
}

const useAuthorizationSettingsYaml = () => {
	const [authorizationSettingsYaml, setAuthorizationSettingsYaml] = useState<string>()
	const [loaded, setLoaded] = useState(false)

    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshAuthorizationSettings = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()
	const {route} = useRoute()

    useEffect(() => {
        ; (async () => {
            setErrorMessage('')
            setAuthorizationSettingsYaml(undefined)
            if (!userId) return
            let canceled = false
            const req: GetAuthorizationSettingsYamlRequest = {
                type: 'getAuthorizationSettingsYaml',
				zone: route.zone,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetAuthorizationSettingsYamlResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setAuthorizationSettingsYaml(resp.authorizationSettingsYaml)
			setLoaded(true)
            return () => { canceled = true }
        })()
    }, [userId, accessToken, refreshCode, setErrorMessage, route.zone])

	const saveAuthorizationSettingsYaml = useMemo(() => (
		async (x: string) => {
			if (!userId) return
			const req: SetAuthorizationSettingsYamlRequest = {
				type: 'setAuthorizationSettingsYaml',
				authorizationSettingsYaml: x,
				zone: route.zone,
				auth: { userId, githubAccessToken: accessToken }
			}
			const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isSetAuthorizationSettingsYamlResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
			setAuthorizationSettingsYaml(x)
		}
	), [userId, accessToken, setErrorMessage, route.zone])

    return { authorizationSettingsYaml, refreshUsage: refreshAuthorizationSettings, saveAuthorizationSettingsYaml, loaded }
}

const editorOptions = {
	selectOnLineNumbers: true
}

const defaultAuthorizationSettingsYaml = YAML.stringify({
	allowPublicUpload: true,
	authorizedUsers: [
		{
			userId: '[test-user]',
			upload: true
		}
	]
})

const AuthorizationSettingsTab: FunctionComponent<Props> = ({width, height}) => {
	const {authorizationSettingsYaml, saveAuthorizationSettingsYaml, loaded} = useAuthorizationSettingsYaml()
	const [editAuthorizationSettingsYaml, setEditAuthorizationSettingsYaml] = useState<string>('')
	const W = Math.min(width - 50, 800)
	const H = height - 120

	const [status, setStatus] = useState<'ready' | 'saving' | 'error'>('ready')

	useEffect(() => {
		if ((authorizationSettingsYaml === undefined) && (loaded)) {
			setEditAuthorizationSettingsYaml(defaultAuthorizationSettingsYaml)
		}
		else {
			setEditAuthorizationSettingsYaml(authorizationSettingsYaml || '')
		}
	}, [authorizationSettingsYaml, loaded])

	const valid = useMemo(() => {
		let x
		try {
			x = YAML.parse(editAuthorizationSettingsYaml || '')
		}
		catch(err) {
			return false
		}
		if (!isAuthorizationSettings(x)) {
			return false
		}
		return true
	}, [editAuthorizationSettingsYaml])

	const saveEnabled = useMemo(() => (
		(authorizationSettingsYaml !== editAuthorizationSettingsYaml) && (status !== 'saving') && (loaded) && (valid)
	), [authorizationSettingsYaml, editAuthorizationSettingsYaml, status, loaded, valid])

	const handleSave = useCallback(() => {
		setStatus('saving')
		saveAuthorizationSettingsYaml(editAuthorizationSettingsYaml).then(() => {
			setStatus('ready')
		}).catch(err => {
			setStatus('error')
		})
	}, [editAuthorizationSettingsYaml, saveAuthorizationSettingsYaml])

	return (
		<div style={{overflowY: 'auto', position: 'absolute', width, height}}>
			<h3>Authorization Settings</h3>
			<p>Changes may take up to 3 minutes to take effect.</p>
			<div>
				<Button disabled={!saveEnabled} onClick={handleSave}>Save</Button>
				&nbsp;
				<span>{status === 'ready' ? '' : status === 'saving' ? 'saving...' : status === 'error' ? 'error saving' : ''}</span>
			</div>
			<MonacoEditor
				width={W}
				height={H}
				language="yaml"
				theme="vs-dark"
				value={editAuthorizationSettingsYaml}
				options={editorOptions}
				onChange={setEditAuthorizationSettingsYaml}
			/>
		</div>
	)
}

export default AuthorizationSettingsTab
