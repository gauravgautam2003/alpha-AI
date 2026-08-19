
export const getCurrentUser = async (req, res) => {
    try {
        const userObj = {
            _id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar
        };
        return res.status(200).json({
            user: userObj,
            avatar: req.user.avatar,
            _id: req.user.userId
        });
    } catch (error) {
        return res.status(400).json({message: `get current user error: ${error}`});
    }
}

