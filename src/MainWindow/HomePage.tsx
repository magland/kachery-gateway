import { FunctionComponent } from 'react';
import { useSignedIn } from '../components/googleSignIn/GoogleSignIn';

// const adminUsersJson = process.env.REACT_APP_ADMIN_USERS || "[]"
// const adminUsers = JSON.parse(adminUsersJson) as any as string[]

type Props = {
}

const HomePage: FunctionComponent<Props> = () => {
    const {signedIn, userId} = useSignedIn()
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
            <p />
            <hr />
        </div>
    )
}

export default HomePage