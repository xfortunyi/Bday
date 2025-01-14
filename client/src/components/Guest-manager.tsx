import React from 'react';
import '../Styles/Text-form.style.css';
import { postGuest } from '../services/server-client';

type GuestManagerProps = {
	guestList: guest[];
	setGuestList: React.Dispatch<React.SetStateAction<guest[]>>;
	userMail: string;
};
export type guest = {
	name: string;
	mail: string;
	host?: string;
	invitationSent?: boolean;
	confirmed?: boolean;
};

const GuestManager: React.FC<GuestManagerProps> = ({
	guestList,
	setGuestList,
	userMail,
}) => {
	async function onSubmitHandler(e: React.FormEvent) {
		e.preventDefault();
		const target = e.target as typeof e.target & {
			name: { value: string };
			email: { value: string };
		};

		const guest: guest = {
			name: target.name.value,
			mail: target.email.value,
		};
		const savedGuest = await postGuest('11', guest);
		setGuestList([...guestList, savedGuest]);
	}

	return (
		<div className="text-menu">
			<form id="details-form" onSubmit={onSubmitHandler}>
				<label>Guest Name</label>
				<input type="text" name="name" placeholder="name" />
				<label>Email</label>
				<input type="email" name="email" placeholder="email" />
				<button type="submit">Send</button>
			</form>
		</div>
	);
};
export default GuestManager;
