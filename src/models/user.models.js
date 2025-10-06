import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, //cloudinary url
      required: true
    },
    coverImage: {
      type: String, //cloudinary url
    },
    watchHistory: [{
      type: Schema.Types.ObjectId,
      ref: "videos"
    }],
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    refreshTokens: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
    
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrect = async function(password)
{
 return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessTokens =  function()
{
 return jwt.sign(
    {
      _id : this._id,
      password: this.password,
      username: this.username,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshTokens =  function() {
 return jwt.sign( {
   _id : this._id
  },
  process.env.REFRESH_TOKEN_SECRET,
{
  expiresIn: process.env.REFRESH_TOKEN_EXPIRY
})
}
export const User = mongoose.model("User", userSchema)