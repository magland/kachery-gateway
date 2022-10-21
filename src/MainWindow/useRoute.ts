import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NodeId } from '../types/keypair'

export type Route = {
    page: 'home'
} | {
    page: 'clients'
} | {
    page: 'client'
    clientId: NodeId
} | {
    page: 'admin'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const p = location.pathname
    let route: Route = {page: 'home'}
    if (p === '/clients') {
        route = {
            page: 'clients'
        }
    }
    else if (p.startsWith('/client')) {
        const x = p.split('/')
        if (x.length === 3) {
            route = {
                page: 'client',
                clientId: x[2] as any as NodeId
            }
        }
    }
    else if (p === '/admin') {
        route = {
            page: 'admin'
        }
    }

    const setRoute = useCallback((route: Route) => {
        let pathname2 = '/home'
        if (route.page === 'clients') {
            pathname2 = `/clients`
        }
        else if (route.page === 'client') {
            pathname2 = `/client/${route.clientId}`
        }
        else if (route.page === 'admin') {
            pathname2 = `/admin`
        }
        navigate({...location, pathname: pathname2})
    }, [location, navigate])
    
    return {route, setRoute}
}

export default useRoute