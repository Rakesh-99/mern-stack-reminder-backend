import express from 'express';
const router = express.Router();
import { addSignupUser, loginUser, otpVerify, createReminders, viewReminders, deleteReminder, updateReminder } from '../Controller/UserController.js';





// Post Api : 
router.post('/signup', addSignupUser);
router.post('/login', loginUser);

// Get Api : 

router.post('/otpverify', otpVerify);




router.post('/createreminder', createReminders);
router.get('/viewreminders', viewReminders);
// router.put('/editreminders/:id', updateReminder);
router.patch('editreminders/:id', updateReminder);
router.delete('/deletereminders/:id', deleteReminder);





export default router;