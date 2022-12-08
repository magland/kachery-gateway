import { FunctionComponent } from 'react';
import Hyperlink from '../components/Hyperlink/Hyperlink';
import { useGithubAuth } from '../GithubAuth/useGithubAuth';

// const adminUsersJson = process.env.REACT_APP_ADMIN_USERS || "[]"
// const adminUsers = JSON.parse(adminUsersJson) as any as string[]

type Props = {
}

const HomePage: FunctionComponent<Props> = () => {
    const {signedIn, userId} = useGithubAuth()
    return (
        <div>
            <div className='PageHeading'>
                Welcome to Kachery Gateway
            </div>
            {
                signedIn ? (
                    <p>You are signed in as {userId}</p>
                ) : (
                    <p>You are not signed in. Sign in above.</p>
                )
            }
            <hr />
            <Hyperlink href="https://github.com/flatironinstitute/kachery-cloud/blob/main/README.md">Read about Kachery</Hyperlink>
            <p />
            <hr />
        </div>
    )
}

export default HomePage