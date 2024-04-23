import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    try {
        const comments = await Comment.aggregatePaginate([
            {
                $match: {
                    video: mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "_id",
                    foreignField: "owner",
                    as: "commentOwner",
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "commentOwner"
                    }
                }
            }
        ], { page, limit }, { sort: { createdAt: -1 } })
        
        if (!comments?.length()) {
            throw new ApiError(406, "No Comments on this Video!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { comments }, "Comments Loaded Successfully!"))

    } catch (error) {
        throw new ApiError(405, "Problem in Loading Comments!")
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    asyncHandler(async (req, res) => {

        const { videoId } = req.params
        const { content } = req.body
        const { user } = req.body

        const newComment = new Comment({
            content,
            video: videoId,
            owner: user._id
        })

        try {
            await newComment.save();
        } catch (error) {
            throw new ApiError(405, "Problem in Adding Comment!")
        }
    })
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { content, commentId } = req.body

    try {
        const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })

        return res
            .status(200)
            .json(new ApiResponse(200, { updatedComment }, "Comment Updated Successfully!"))

    } catch (error) {
        throw new ApiError(405, error?.message || "Problem in Updating Comment!")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.body

    try {
        await Comment.findByIdAndDelete(commentId)
    } catch (error) {
        throw new ApiError(408, error?.message || "Problem in Deleting Comment!")
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}