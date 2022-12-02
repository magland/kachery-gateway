import QueryString from 'querystring'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isNodeId, isSignature, NodeId, Signature } from '../types/keypair'

export type Route = {
    page: 'home'
} | {
    page: 'clients'
} | {
    page: 'resources'
} | {
    page: 'client'
    clientId: NodeId
} | {
    page: 'resource'
    resourceName: string
} | {
    page: 'registerClient',
    clientId: NodeId,
    signature: Signature,
    label: string
} | {
    page: 'admin'
} | {
    page: 'github-auth'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const query = useMemo(() => (QueryString.parse(location.search.slice(1))), [location.search]);

    const p = location.pathname
    let route: Route = {page: 'home'}
    if (p === '/clients') {
        route = {
            page: 'clients'
        }
    }
    else if (p === '/resources') {
        route = {
            page: 'resources'
        }
    }
    else if (p.startsWith('/client/')) {
        const x = p.split('/')
        if (x.length === 3) {
            route = {
                page: 'client',
                clientId: x[2] as any as NodeId
            }
        }
    }
    else if (p.startsWith('/resource/')) {
        const x = p.split('/')
        if (x.length === 3) {
            route = {
                page: 'resource',
                resourceName: x[2]
            }
        }
    }
    else if (p.startsWith('/registerClient')) {
        const x = p.split('/')
        if (x.length === 3) {
            const clientId = x[2]
            const signature = query.signature
            const label = query.label as string
            if ((isNodeId(clientId)) && (isSignature(signature))) {
                route = {
                    page: 'registerClient',
                    clientId,
                    signature,
                    label
                }
            }
        }
    }
    else if (p === '/admin') {
        route = {
            page: 'admin'
        }
    }
    else if (p === '/github/auth') {
        route = {
            page: 'github-auth'
        }
    }

    const setRoute = useCallback((route: Route) => {
        const query2 = {...query}
        let pathname2 = '/home'
        if (route.page === 'resources') {
            pathname2 = `/resources`
        }
        else if (route.page === 'client') {
            pathname2 = `/client/${route.clientId}`
        }
        else if (route.page === 'registerClient') {
            pathname2 = `/registerClient/${route.clientId}`
            query2['signature'] = route.signature.toString()
            query2['label'] = route.label.toString()
        }
        else if (route.page === 'admin') {
            pathname2 = `/admin`
        }
        else if (route.page === 'github-auth') {
            pathname2 = '/github/auth'
        }
        const search2 = queryString(query2)
        navigate({...location, pathname: pathname2, search: search2})
    }, [location, navigate, query])
    
    return {route, setRoute}
}

const queryString = (params: { [key: string]: string | string[] | undefined }) => {
    const keys = Object.keys(params)
    if (keys.length === 0) return ''
    return '?' + (
        keys.map((key) => {
            const v = params[key]
            if (v === undefined) {
                return encodeURIComponent(key) + '='
            }
            else if (typeof(v) === 'string') {
                return encodeURIComponent(key) + '=' + v
            }
            else {
                return v.map(a => (encodeURIComponent(key) + '=' + a)).join('&')
            }
        }).join('&')
    )
}

export default useRoute