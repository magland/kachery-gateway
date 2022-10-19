import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export type Route = {
    page: 'home'
} | {
    page: 'project'
    projectId: string
} | {
    page: 'dataset',
    datasetId: string
} | {
    page: 'submission',
    submissionId: string
} | {
    page: 'admin'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const p = location.pathname
    let route: Route = {page: 'home'}
    if (p.startsWith('/project/')) {
        const x = p.split('/')
        const projectId = x[2]
        route = {
            page: 'project',
            projectId
        }
    }
    else if (p.startsWith('/dataset/')) {
        const x = p.split('/')
        const datasetId = x[2]
        route = {
            page: 'dataset',
            datasetId
        }
    }
    else if (p.startsWith('/submission/')) {
        const x = p.split('/')
        const submissionId = x[2]
        route = {
            page: 'submission',
            submissionId
        }
    }
    else if (p === '/admin') {
        route = {
            page: 'admin'
        }
    }

    const setRoute = useCallback((route: Route) => {
        let pathname2 = '/home'
        if (route.page === 'project') {
            pathname2 = `/project/${route.projectId}`
        }
        else if (route.page === 'dataset') {
            pathname2 = `/dataset/${route.datasetId}`
        }
        else if (route.page === 'submission') {
            pathname2 = `/submission/${route.submissionId}`
        }
        else if (route.page === 'admin') {
            pathname2 = `/admin`
        }
        navigate({...location, pathname: pathname2})
    }, [location, navigate])
    
    return {route, setRoute}
}

export default useRoute