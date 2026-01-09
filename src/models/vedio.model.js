import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const vedioSchema = new Schema({
    title: {type: String, required: true, index: true},
    description: {type: String, required: true, trim: true},
    videoFile: {type: String, required: true}, //cloudinary url
    thumbnail: {type: String, required: true}, //cloudinary url
    duration: {type: Number, required: true},
    owner: {type: Schema.Types.ObjectId, ref: "User"},
    isPublished: {type: Boolean, default: false}
}, {
    timestamps: true
})
vedioSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", vedioSchema)