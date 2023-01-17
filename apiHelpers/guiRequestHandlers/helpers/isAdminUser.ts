const adminUsersJson = process.env.REACT_APP_ADMIN_USERS || "[]"
const adminUsers = JSON.parse(adminUsersJson) as any as string[]

const isAdminUser = (userId?: string) => {
    if (!userId) return false
    return adminUsers.includes(userId)
}

export default isAdminUser