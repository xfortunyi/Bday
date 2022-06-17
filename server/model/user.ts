import mongoose from './';

const Schema = mongoose.Schema;
const userSchema = new Schema({
	userId: {
		type: String,
		required: true,
		unique: true,
	},
	name: String,
	email: { type: String, required: true },
	password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

export default User;
