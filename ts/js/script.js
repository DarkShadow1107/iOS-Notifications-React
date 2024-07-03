import ReactDOM from "https://cdn.skypack.dev/react-dom";
import React, { useCallback, useState, useRef, memo } from "https://cdn.skypack.dev/react";
import { nanoid } from "https://cdn.skypack.dev/nanoid@5.0.5";
import { BsCheckLg, BsXLg, BsInfoLg, BsExclamationLg } from "https://cdn.skypack.dev/react-icons@4.12.0/bs";
import { MdClose, MdAdd } from "https://cdn.skypack.dev/react-icons@4.12.0/md";
import { TransitionGroup, CSSTransition } from "https://cdn.skypack.dev/react-transition-group";
const TIMEOUT = 5000; // Notifications will be removed automatically after 5 seconds, unless hovered over.
const ANIMATION_DURATION = 400;
const MAX_NOTIFICATIONS = 5;
const STACKING_OVERLAP = 0.9; // A range from 0 to 1 representing the percentage of the notification's height that should overlap the next notification
const NOTIFICATION_ICON = {
	success: BsCheckLg,
	error: BsXLg,
	info: BsInfoLg,
	warning: BsExclamationLg,
};
var Type;
(function (Type) {
	Type["success"] = "success";
	Type["error"] = "error";
	Type["info"] = "info";
	Type["warning"] = "warning";
})(Type || (Type = {}));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const useNotifications = () => {
	const timeouts = useRef([]);
	const paused = useRef(null);
	const [notifications, setNotifications] = useState([]);
	const add = useCallback((n) => {
		const notification = Object.assign({}, n);
		notification.id = nanoid();
		notification.timeout += Date.now();
		setNotifications((n) => {
			const next = [notification, ...n];
			if (n.length >= MAX_NOTIFICATIONS) {
				next.pop();
			}
			return next;
		});
		timeouts.current.push(
			setTimeout(() => {
				remove(notification.id);
			}, notification.timeout - Date.now())
		);
	}, []);
	const pause = useCallback(() => {
		timeouts.current.forEach(clearTimeout);
		timeouts.current = [];
		paused.current = Date.now();
	}, []);
	const resume = useCallback(() => {
		setNotifications((n) => {
			return n.map((notification) => {
				notification.timeout += Date.now() - paused.current;
				timeouts.current.push(
					setTimeout(() => {
						remove(notification.id);
					}, notification.timeout - Date.now())
				);
				return notification;
			});
		});
	}, [notifications]);
	const remove = useCallback((id) => {
		setNotifications((n) => n.filter((n) => n.id !== id));
	}, []);
	const props = { notifications, remove, pause, resume };
	return { props, add };
};
const Notification = memo(({ id, title, content, type, index, total, remove }) => {
	const Icon = NOTIFICATION_ICON[type];
	const inverseIndex = total - index - 1;
	const scale = 1 - inverseIndex * 0.05;
	const opacity = 1 - (inverseIndex / total) * 0.1;
	const bg = `hsl(0 0% ${100 - inverseIndex * 15}% / 40%)`;
	const y = inverseIndex * 100 * STACKING_OVERLAP;
	return React.createElement(
		"div",
		{ className: "notification", style: { "--bg": bg, "--opacity": opacity, "--scale": scale, "--y": `${y}%` } },
		React.createElement(
			"div",
			{ className: "notification-inner" },
			React.createElement("div", { className: `icon ${type}` }, React.createElement(Icon, null)),
			React.createElement("div", null, React.createElement("h2", null, title), React.createElement("p", null, content)),
			React.createElement("button", { className: "close", onClick: () => remove(id) }, React.createElement(MdClose, null))
		)
	);
});
const Notifications = ({ notifications, remove, pause, resume, animationDuration }) => {
	return React.createElement(
		TransitionGroup,
		{
			className: "notifications",
			style: { "--duration": `${animationDuration}ms` },
			onMouseEnter: pause,
			onMouseLeave: resume,
		},
		[...notifications]
			.reverse()
			.map((notification, index) =>
				React.createElement(
					CSSTransition,
					{ key: notification.id, timeout: animationDuration },
					React.createElement(
						Notification,
						Object.assign({}, notification, { remove: remove, index: index, total: notifications.length })
					)
				)
			)
	);
};
export const App = () => {
	const { props, add } = useNotifications();
	return React.createElement(
		"div",
		{ className: "app" },
		React.createElement(Notifications, Object.assign({}, props, { animationDuration: ANIMATION_DURATION })),
		React.createElement(
			"button",
			{
				className: "add-button",
				onClick: () => {
					const types = Object.keys(Type);
					const type = types[randomInt(0, types.length - 1)];
					const title = `${type[0].toUpperCase() + type.slice(1)} Notification`;
					add({ title, content: "Some notification description", timeout: TIMEOUT, type });
				},
			},
			React.createElement(MdAdd, null),
			"Add Notification"
		)
	);
};
ReactDOM.render(React.createElement(App, null), document.body);
