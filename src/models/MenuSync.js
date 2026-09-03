import mongoose from "mongoose";

const MenuSyncSchema = new mongoose.Schema(
    {
        resId: {
            type: String,
            required: true,
            index: true,
        },
        platform: {
            type: String,
            default: "zomato",
            index: true,
        },
        taskId: String,
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        updated_menu: mongoose.Schema.Types.Mixed,
        error: String,
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.MenuSync ||
    mongoose.model("MenuSync", MenuSyncSchema);
