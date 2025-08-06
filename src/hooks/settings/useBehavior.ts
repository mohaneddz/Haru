import { onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import { createMemo } from 'solid-js';
import { setStoreValue, getStoreValue } from '@/config/store';

import enLocale from 'i18n-iso-countries/langs/en.json';
import countries from 'i18n-iso-countries';

export default function useBehavior() {
	const [location, setLocation] = createSignal('Anonymous');
	const [chatStyle, setChatStyle] = createSignal('');
	const [notificationsEnabled, setNotificationsEnabled] = createSignal(true);
	const [autoSaveEnabled, setAutoSaveEnabled] = createSignal(true);
	const [serverStartup, setServerStartup] = createSignal(true);

	countries.registerLocale(enLocale);

	const countryOptions = createMemo(() => [
		{ value: 'Anonymous', label: 'Anonymous' },
		...Object.entries(countries.getNames('en')).map(([code, name]) => ({
			value: code,
			label: name,
		})),
	]);

	const toggleNotifications = () => {
		setNotificationsEnabled(!notificationsEnabled());
	};

	const toggleAutoSave = () => {
		setAutoSaveEnabled(!autoSaveEnabled());
	};

	const toggleServerStartup = () => {
		setServerStartup(!serverStartup());
	};

	onMount(async () => {
		const storedLocation = await getStoreValue('location');
		const storedNotificationsEnabled = await getStoreValue('notificationsEnabled');
		const storedAutoSaveEnabled = await getStoreValue('autoSaveEnabled');
		const storedServerStartup = await getStoreValue('serverStartup');
		const storedChatStyle = await getStoreValue('chatStyle');

		storedLocation && typeof storedLocation === 'string' && setLocation(storedLocation);
		typeof storedNotificationsEnabled === 'boolean' && setNotificationsEnabled(storedNotificationsEnabled);
		typeof storedAutoSaveEnabled === 'boolean' && setAutoSaveEnabled(storedAutoSaveEnabled);
		typeof storedServerStartup === 'boolean' && setServerStartup(storedServerStartup);
		storedChatStyle && typeof storedChatStyle === 'string' && setChatStyle(storedChatStyle);
	});

	const saveSettings = async () => {
		await setStoreValue('location', location());
		await setStoreValue('notificationsEnabled', notificationsEnabled());
		await setStoreValue('autoSaveEnabled', autoSaveEnabled());
		await setStoreValue('serverStartup', serverStartup());
		await setStoreValue('chatStyle', chatStyle());
	};

	return {
		location,
		autoSaveEnabled,
		notificationsEnabled,
		countryOptions,
		chatStyle,

		toggleNotifications,
		toggleAutoSave,
		toggleServerStartup,

		setChatStyle,
		setLocation,
		setNotificationsEnabled,
		setAutoSaveEnabled,
		serverStartup,
		setServerStartup,

		saveSettings,
	};
}
