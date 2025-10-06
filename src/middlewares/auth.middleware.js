import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js'

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        console.log("Access Token (cookie):", req.cookies?.accessToken);
        console.log("Authorization Header:", req.header("Authorization"));

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token || typeof token !== "string") {
            throw new ApiError(401, "Invalid or missing token");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshTokens")

        if (!user) {
            throw new ApiError(402, "Invalide Access Token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})
