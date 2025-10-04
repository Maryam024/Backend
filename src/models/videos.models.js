import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const {Schema} = mongoose;

const videoSchema = new Schema(
{
videoFile:{
    type: String,
    required: true
},
thumbnail:{
    type: String,
    required: true
},
title:{
    type: String,
    required: true,
},
description:{
    type: String,
    required: true
},
duration:{
    type: Number,
    required: true
},
views:{
    type: Number,
    default: 0
},
isPublished:{
    type: Boolean,
    default: false
},
uploadedBy:{
    type: Schema.Types.ObjectId,
    ref: "User",
}
},
{
    timestamps: true
})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema);