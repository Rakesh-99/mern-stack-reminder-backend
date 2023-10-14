import mongoose from "mongoose";







// Mongoose Schema :

const reminderSchema = new mongoose.Schema({

    "title": {
        type: 'String',
        required: true,
        unique: [true, 'Duplicate title entered']

    },
    "description": {
        type: String,
        required: true,
        unique: [true, 'Duplicate description entered']
    }
});


// Mongoose Model :

export const reminderModel = mongoose.model('Reminder', reminderSchema);